const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.encoding = 'hex';
        this.authTagLength = 16;
    }

    /**
     * Encrypt sensitive data
     * @param {string} data - Data to encrypt
     * @param {string} masterKey - Encryption key (32 bytes for AES-256)
     * @returns {object} - {iv, encryptedData, authTag}
     */
    encrypt(data, masterKey) {
        // Ensure key is 32 bytes
        const key = crypto
            .createHash('sha256')
            .update(String(masterKey))
            .digest();

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);

        let encryptedData = cipher.update(JSON.stringify(data), 'utf8', this.encoding);
        encryptedData += cipher.final(this.encoding);

        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString(this.encoding),
            encryptedData,
            authTag: authTag.toString(this.encoding),
            timestamp: Date.now()
        };
    }

    /**
     * Decrypt sensitive data
     * @param {object} encrypted - {iv, encryptedData, authTag}
     * @param {string} masterKey - Encryption key
     * @returns {object} - Decrypted data
     */
    decrypt(encrypted, masterKey) {
        try {
            const key = crypto
                .createHash('sha256')
                .update(String(masterKey))
                .digest();

            const decipher = crypto.createDecipheriv(
                this.algorithm,
                key,
                Buffer.from(encrypted.iv, this.encoding)
            );

            decipher.setAuthTag(Buffer.from(encrypted.authTag, this.encoding));

            let decryptedData = decipher.update(encrypted.encryptedData, this.encoding, 'utf8');
            decryptedData += decipher.final('utf8');

            return JSON.parse(decryptedData);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    /**
     * Hash sensitive data (one-way)
     * @param {string} data - Data to hash
     * @returns {string} - Hash
     */
    hash(data) {
        return crypto
            .createHash('sha256')
            .update(String(data))
            .digest(this.encoding);
    }

    /**
     * Generate a random key
     * @returns {string} - Random key
     */
    generateKey() {
        return crypto.randomBytes(32).toString(this.encoding);
    }

    /**
     * Create digital signature
     * @param {string} data - Data to sign
     * @param {string} privateKey - Private key
     * @returns {string} - Signature
     */
    sign(data, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(JSON.stringify(data));
        return sign.sign(privateKey, this.encoding);
    }

    /**
     * Verify digital signature
     * @param {string} data - Original data
     * @param {string} signature - Signature
     * @param {string} publicKey - Public key
     * @returns {boolean} - Is valid
     */
    verify(data, signature, publicKey) {
        const verify = crypto.createVerify('SHA256');
        verify.update(JSON.stringify(data));
        return verify.verify(publicKey, signature, this.encoding);
    }
}

module.exports = new EncryptionService();

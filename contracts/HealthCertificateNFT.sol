// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthCertificateNFT {
    string public name = "Health Certificate NFT";
    string public symbol = "HCN";

    struct Certificate {
        address recipient;
        string certificateType; // "Doctor", "Pharmacist", "Nurse"
        string licenseNumber;
        uint256 issuedDate;
        uint256 expiryDate;
        string ipfsHash;
        bool revoked;
    }

    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) public userCertificates;
    uint256 public tokenCounter = 0;

    event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string certificateType);
    event CertificateRevoked(uint256 indexed tokenId);

    // Multi-signature approval mapping
    mapping(uint256 => mapping(address => bool)) public approvals;
    mapping(uint256 => uint256) public approvalCount;
    address[] public authorizedSigners = [msg.sender];

    function addSigner(address signer) public {
        require(msg.sender == authorizedSigners[0], "Only owner can add signers");
        authorizedSigners.push(signer);
    }

    function issueCertificate(
        address recipient,
        string memory certificateType,
        string memory licenseNumber,
        uint256 validityYears,
        string memory ipfsHash
    ) public returns (uint256) {
        uint256 tokenId = tokenCounter++;
        
        certificates[tokenId] = Certificate({
            recipient: recipient,
            certificateType: certificateType,
            licenseNumber: licenseNumber,
            issuedDate: block.timestamp,
            expiryDate: block.timestamp + (validityYears * 365 days),
            ipfsHash: ipfsHash,
            revoked: false
        });

        userCertificates[recipient].push(tokenId);
        emit CertificateIssued(tokenId, recipient, certificateType);
        return tokenId;
    }

    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        if (certificates[tokenId].revoked) return false;
        if (block.timestamp > certificates[tokenId].expiryDate) return false;
        return true;
    }

    function revokeCertificate(uint256 tokenId) public {
        require(msg.sender == certificates[tokenId].recipient || 
                msg.sender == authorizedSigners[0], "Not authorized");
        certificates[tokenId].revoked = true;
        emit CertificateRevoked(tokenId);
    }

    function getUserCertificates(address user) public view returns (uint256[] memory) {
        return userCertificates[user];
    }
}

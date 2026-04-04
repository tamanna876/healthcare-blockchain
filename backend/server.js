const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { ethers } = require("ethers");
const { create } = require("ipfs-http-client");

const app = express();

app.use(cors());
app.use(express.json());

/* -------------------------------
   File Upload Setup
--------------------------------*/

const upload = multer({ dest: "uploads/" });

/* -------------------------------
   IPFS Connection
--------------------------------*/

const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https"
});

/* -------------------------------
   Blockchain Connection
--------------------------------*/

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const wallet = new ethers.Wallet(privateKey, provider);

const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

const abi = [
  {
    inputs: [
      { internalType: "address", name: "patient", type: "address" },
      { internalType: "string", name: "ipfsHash", type: "string" }
    ],
    name: "addRecord",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "patient", type: "address" }],
    name: "getRecords",
    outputs: [
      {
        components: [
          { internalType: "string", name: "ipfsHash", type: "string" },
          { internalType: "address", name: "doctor", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" }
        ],
        internalType: "struct MedicalRecords.Record[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

/* -------------------------------
   Routes
--------------------------------*/

app.get("/", (req, res) => {
  res.send("Healthcare Blockchain Backend Running");
});

/* -------------------------------
   Upload Page (Browser Test)
--------------------------------*/

app.get("/upload-page", (req, res) => {
  res.send(`
    <h2>Upload Medical File</h2>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});

/* -------------------------------
   Upload File to IPFS
--------------------------------*/

app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded"
      });
    }

    const fileBuffer = fs.readFileSync(req.file.path);

    const result = await ipfs.add(fileBuffer);

    res.json({
      message: "File uploaded to IPFS",
      ipfsHash: result.path
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------
   Add Record to Blockchain
--------------------------------*/

app.post("/addRecord", async (req, res) => {
  try {

    const { patient, ipfsHash } = req.body;

    const tx = await contract.addRecord(patient, ipfsHash);

    await tx.wait();

    res.json({
      message: "Medical record added successfully",
      transactionHash: tx.hash
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------
   Get Records
--------------------------------*/

app.get("/records/:patient", async (req, res) => {
  try {

    const records = await contract.getRecords(req.params.patient);

    const formatted = records.map((r) => ({
      ipfsHash: r.ipfsHash,
      doctor: r.doctor,
      timestamp: r.timestamp.toString()
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* -------------------------------
   Start Server
--------------------------------*/

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

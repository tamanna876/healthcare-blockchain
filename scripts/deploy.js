import hre from "hardhat";

async function main() {
  const { ethers } = hre;

  // MedicalRecords
  const MedicalRecords = await ethers.getContractFactory("MedicalRecords");
  const medicalRecords = await MedicalRecords.deploy();

  await medicalRecords.deployed();

  console.log("MedicalRecords deployed to:", medicalRecords.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
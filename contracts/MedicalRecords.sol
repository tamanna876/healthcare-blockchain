// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicalRecords {

    struct Record {
        string ipfsHash;
        address doctor;
        uint256 timestamp;
    }

    mapping(address => Record[]) private records;

    function addRecord(address patient, string memory ipfsHash) public {
        records[patient].push(
            Record(ipfsHash, msg.sender, block.timestamp)
        );
    }

    function getRecords(address patient) public view returns (Record[] memory) {
        return records[patient];
    }
}
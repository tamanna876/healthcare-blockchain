// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedicineVerification {

    struct Medicine {
        string name;
        string manufacturer;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Medicine) public medicines;

    function registerMedicine(
        string memory medicineId,
        string memory name,
        string memory manufacturer
    ) public {

        medicines[medicineId] = Medicine(
            name,
            manufacturer,
            block.timestamp,
            true
        );
    }

    function verifyMedicine(string memory medicineId) public view returns(bool) {
        return medicines[medicineId].exists;
    }
}
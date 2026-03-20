// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BloodDonation {

    struct Donor {
        string name;
        string bloodGroup;
        string location;
        address wallet;
    }

    Donor[] public donors;

    function registerDonor(
        string memory name,
        string memory bloodGroup,
        string memory location
    ) public {

        donors.push(
            Donor(name, bloodGroup, location, msg.sender)
        );
    }

    function getDonors() public view returns (Donor[] memory) {
        return donors;
    }
}
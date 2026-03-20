// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrganDonation {

    struct Donor {
        string name;
        string organ;
        string bloodGroup;
        string location;
    }

    Donor[] public donors;

    function registerDonor(
        string memory name,
        string memory organ,
        string memory bloodGroup,
        string memory location
    ) public {

        donors.push(Donor(name, organ, bloodGroup, location));
    }

    function getDonors() public view returns (Donor[] memory) {
        return donors;
    }
}
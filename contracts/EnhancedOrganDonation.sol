// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHealthTokenOrgan {
    function rewardOrganDonor(address donor) external;
}

contract EnhancedOrganDonation {
    IHealthTokenOrgan public healthToken;

    struct Donor {
        address donorAddress;
        string name;
        string organ;
        string bloodGroup;
        string location;
        uint256 registrationDate;
        bool isActive;
    }

    struct OrganRequest {
        address requester;
        string organNeeded;
        string bloodGroup;
        string location;
        int32 latitude;
        int32 longitude;
        uint256 urgency; // 1-10 (10 = critical)
        bool fulfilled;
        address[] approvers;
        mapping(address => bool) approvals;
        uint256 approvalCount;
    }

    mapping(address => Donor) public donors;
    mapping(uint256 => OrganRequest) public organRequests;
    address[] public donorList;
    uint256 public requestCounter = 0;
    address[] public medicalAuthorities;

    event DonorRegistered(address indexed donor, string organ);
    event OrganRequestCreated(uint256 indexed requestId, string organ, uint256 urgency);
    event MatchingDonorFound(uint256 indexed requestId, address indexed donor);
    event OrganRequestApproved(uint256 indexed requestId);
    event OrganTransferred(uint256 indexed requestId, address indexed donor, address indexed recipient);

    constructor(address _healthTokenAddress) {
        healthToken = IHealthTokenOrgan(_healthTokenAddress);
        medicalAuthorities.push(msg.sender);
    }

    function registerDonor(
        string memory name,
        string memory organ,
        string memory bloodGroup,
        string memory location
    ) public {
        donors[msg.sender] = Donor({
            donorAddress: msg.sender,
            name: name,
            organ: organ,
            bloodGroup: bloodGroup,
            location: location,
            registrationDate: block.timestamp,
            isActive: true
        });
        donorList.push(msg.sender);
        emit DonorRegistered(msg.sender, organ);
    }

    function createOrganRequest(
        string memory organNeeded,
        string memory bloodGroup,
        string memory location,
        int32 latitude,
        int32 longitude,
        uint256 urgency
    ) public returns (uint256) {
        require(urgency >= 1 && urgency <= 10, "Invalid urgency");
        
        uint256 requestId = requestCounter++;
        OrganRequest storage req = organRequests[requestId];
        req.requester = msg.sender;
        req.organNeeded = organNeeded;
        req.bloodGroup = bloodGroup;
        req.location = location;
        req.latitude = latitude;
        req.longitude = longitude;
        req.urgency = urgency;
        req.fulfilled = false;
        req.approvers = medicalAuthorities;

        // Find matching donors automatically
        findMatchingDonors(requestId, organNeeded, bloodGroup);

        emit OrganRequestCreated(requestId, organNeeded, urgency);
        return requestId;
    }

    function findMatchingDonors(
        uint256 requestId,
        string memory organNeeded,
        string memory requiredBloodGroup
    ) internal {
        for (uint i = 0; i < donorList.length; i++) {
            address donorAddr = donorList[i];
            Donor memory donor = donors[donorAddr];

            if (keccak256(abi.encodePacked(donor.organ)) == keccak256(abi.encodePacked(organNeeded)) &&
                keccak256(abi.encodePacked(donor.bloodGroup)) == keccak256(abi.encodePacked(requiredBloodGroup)) &&
                donor.isActive) {
                emit MatchingDonorFound(requestId, donorAddr);
            }
        }
    }

    // Multi-sig approval for organ transfer
    function approveOrganTransfer(uint256 requestId) public {
        bool isAuthority = false;
        for (uint i = 0; i < medicalAuthorities.length; i++) {
            if (medicalAuthorities[i] == msg.sender) {
                isAuthority = true;
                break;
            }
        }
        require(isAuthority, "Not an authority");
        require(!organRequests[requestId].approvals[msg.sender], "Already approved");

        organRequests[requestId].approvals[msg.sender] = true;
        organRequests[requestId].approvalCount++;

        // If 3 or more authorities approve, it's approved
        if (organRequests[requestId].approvalCount >= 3) {
            organRequests[requestId].fulfilled = true;
            emit OrganRequestApproved(requestId);
        }
    }

    function transferOrgan(uint256 requestId, address donorAddress) public {
        require(organRequests[requestId].fulfilled, "Not approved yet");
        require(!organRequests[requestId].fulfilled, "Already transferred");

        address recipient = organRequests[requestId].requester;

        // Reward donor with tokens
        healthToken.rewardOrganDonor(donorAddress);

        emit OrganTransferred(requestId, donorAddress, recipient);
    }

    function getDonors() public view returns (Donor[] memory) {
        Donor[] memory result = new Donor[](donorList.length);
        for (uint i = 0; i < donorList.length; i++) {
            if (donors[donorList[i]].isActive) {
                result[i] = donors[donorList[i]];
            }
        }
        return result;
    }

    function addMedicalAuthority(address authority) public {
        require(msg.sender == medicalAuthorities[0], "Only owner");
        medicalAuthorities.push(authority);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IHealthToken {
    function rewardBloodDonor(address donor) external;
    function rewardOrganDonor(address donor) external;
}

contract EnhancedBloodDonation {
    IHealthToken public healthToken;

    struct Donor {
        address donorAddress;
        string name;
        string bloodGroup;
        string location;
        uint256 registrationDate;
        bool isActive;
    }

    struct BloodRequest {
        address requester;
        string bloodGroup;
        string location;
        string reason;
        uint256 urgencyLevel; // 1-5
        bool fulfilled;
        address[] approvers;
        mapping(address => bool) approvals;
        uint256 approvalCount;
    }

    mapping(address => Donor) public donors;
    mapping(uint256 => BloodRequest) public bloodRequests;
    address[] public donorList;
    uint256 public requestCounter = 0;
    address[] public medicalAuthorities;

    event DonorRegistered(address indexed donor, string bloodGroup);
    event BloodRequestCreated(uint256 indexed requestId, string bloodGroup, uint256 urgencyLevel);
    event DonorNotified(address indexed donor, uint256 indexed requestId);
    event RequestApproved(uint256 indexed requestId, address indexed approver);
    event RequestFulfilled(uint256 indexed requestId, address indexed donor);

    constructor(address _healthTokenAddress) {
        healthToken = IHealthToken(_healthTokenAddress);
        medicalAuthorities.push(msg.sender);
    }

    function registerDonor(
        string memory name,
        string memory bloodGroup,
        string memory location
    ) public {
        donors[msg.sender] = Donor({
            donorAddress: msg.sender,
            name: name,
            bloodGroup: bloodGroup,
            location: location,
            registrationDate: block.timestamp,
            isActive: true
        });
        donorList.push(msg.sender);
        emit DonorRegistered(msg.sender, bloodGroup);
    }

    function createBloodRequest(
        string memory bloodGroup,
        string memory location,
        string memory reason,
        uint256 urgencyLevel
    ) public returns (uint256) {
        require(urgencyLevel >= 1 && urgencyLevel <= 5, "Invalid urgency level");
        
        uint256 requestId = requestCounter++;
        BloodRequest storage req = bloodRequests[requestId];
        req.requester = msg.sender;
        req.bloodGroup = bloodGroup;
        req.location = location;
        req.reason = reason;
        req.urgencyLevel = urgencyLevel;
        req.fulfilled = false;
        req.approvers = medicalAuthorities;

        // Automatic notification to matching donors
        notifyMatchingDonors(requestId, bloodGroup, location);
        
        emit BloodRequestCreated(requestId, bloodGroup, urgencyLevel);
        return requestId;
    }

    function notifyMatchingDonors(
        uint256 requestId,
        string memory requiredBloodGroup,
        string memory requiredLocation
    ) internal {
        for (uint i = 0; i < donorList.length; i++) {
            address donorAddr = donorList[i];
            if (keccak256(abi.encodePacked(donors[donorAddr].bloodGroup)) == 
                keccak256(abi.encodePacked(requiredBloodGroup)) &&
                donors[donorAddr].isActive) {
                emit DonorNotified(donorAddr, requestId);
            }
        }
    }

    // Multi-signature approval
    function approveBloodRequest(uint256 requestId) public {
        bool isAuthority = false;
        for (uint i = 0; i < medicalAuthorities.length; i++) {
            if (medicalAuthorities[i] == msg.sender) {
                isAuthority = true;
                break;
            }
        }
        require(isAuthority, "Not an authority");
        require(!bloodRequests[requestId].approvals[msg.sender], "Already approved");

        bloodRequests[requestId].approvals[msg.sender] = true;
        bloodRequests[requestId].approvalCount++;

        emit RequestApproved(requestId, msg.sender);

        // If majority approved (more than half), fulfill request
        if (bloodRequests[requestId].approvalCount > medicalAuthorities.length / 2) {
            bloodRequests[requestId].fulfilled = true;
        }
    }

    function fulfillBloodRequest(uint256 requestId, address donorAddress) public {
        require(bloodRequests[requestId].fulfilled, "Request not approved yet");
        require(!bloodRequests[requestId].fulfilled, "Already fulfilled");

        // Reward the donor with tokens
        healthToken.rewardBloodDonor(donorAddress);

        emit RequestFulfilled(requestId, donorAddress);
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

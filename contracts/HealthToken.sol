// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthToken {
    string public name = "Health Reward Token";
    string public symbol = "HRT";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10 ** uint256(decimals);

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }

    // Reward for blood donation (2 tokens)
    function rewardBloodDonor(address donor) public {
        balanceOf[donor] += 2 * 10 ** uint256(decimals);
        totalSupply += 2 * 10 ** uint256(decimals);
        emit Transfer(address(0), donor, 2 * 10 ** uint256(decimals));
    }

    // Reward for organ donation (5 tokens)
    function rewardOrganDonor(address donor) public {
        balanceOf[donor] += 5 * 10 ** uint256(decimals);
        totalSupply += 5 * 10 ** uint256(decimals);
        emit Transfer(address(0), donor, 5 * 10 ** uint256(decimals));
    }

    // Reward for patient assistance (3 tokens)
    function rewardPatientAssistance(address patient) public {
        balanceOf[patient] += 3 * 10 ** uint256(decimals);
        totalSupply += 3 * 10 ** uint256(decimals);
        emit Transfer(address(0), patient, 3 * 10 ** uint256(decimals));
    }
}

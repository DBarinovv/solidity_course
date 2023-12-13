// SPDX-License-Identifier: UNLICENSED 
pragma solidity ^0.8.0;

contract Enrollment {
    // Age first/last doesn't really matter, but DST imho should be last
    struct Student {
        uint8 age;
        string name;
    }

    // uint8 because we now don't need more, 255 is enough
    uint8 public constant GROUPS_COUNT = 5;
    // Mapping from group number to Students in it
    mapping (uint8 => Student[]) private groupStudents;

    // Event shows that we enrolled student
    event StudentAssigned(uint8 groupNumber, uint8 age, string name); 

    // calldata instead of memory for optimization
    function assignToGroup(string calldata _name, uint8 _age) external returns(uint8) {
        // Random group
        uint8 groupNumber = uint8(uint256(keccak256(abi.encodePacked(_name, _age, block.timestamp))) % GROUPS_COUNT);

        // Add student and emit event
        groupStudents[groupNumber].push(Student(_age, _name));
        emit StudentAssigned(groupNumber, _age, _name); 

        return groupNumber;
    }

    function getStudents(uint8 _groupNumber) external view returns (uint8[] memory, string[] memory) {
        require(_groupNumber < GROUPS_COUNT, "Wrong group number");

        Student[] memory students = groupStudents[_groupNumber];

        uint8[] memory ages = new uint8[](students.length);
        string[] memory names = new string[](students.length);

        for (uint i = 0; i < students.length; i++) {
            ages[i] = students[i].age;
            names[i] = students[i].name;
        }

        // returning two arrays because can't work with Student[]
        return (ages, names);
    }
}

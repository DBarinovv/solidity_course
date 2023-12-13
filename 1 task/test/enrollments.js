const Enrollment = artifacts.require("Enrollment");

contract("Enrollment", accounts => {
    let enrollment;

    beforeEach(async () => {
        enrollment = await Enrollment.new();
    });

    it("should assign a student to a group", async () => {
        const studentName = "Alice";
        const studentAge = 20;

        const txnResult = await enrollment.assignToGroup(studentName, studentAge);
        const groupNumber = txnResult.logs[0].args.groupNumber.toNumber();

        assert(0 <= groupNumber && groupNumber < 5, "Group number is out of range");
    });

    it("should retrieve students from a group", async () => {
        const studentName = "Bob";
        const studentAge = 21;

        const txnResult = await enrollment.assignToGroup(studentName, studentAge);
        const groupNumber = txnResult.logs[0].args.groupNumber.toNumber();

        const studentsData = await enrollment.getStudents(groupNumber);

        // console.log("Returned data:", studentsData);
        assert(studentsData.length = 2, "No info retrieved");

        const ages = studentsData[0];
        const names = studentsData[1];

        assert(ages.length > 0 && names.length > 0, "No students retrieved");
        assert.equal(ages[0].toNumber(), studentAge, "Student age does not match");
        assert.equal(names[0], studentName, "Student name does not match");
    });

    it("should not retrieve students from a non-existent group", async () => {
        try {
            await enrollment.getStudents(6);
            assert.fail("Should have thrown an error for a non-existent group");
        } catch (error) {
            assert(error.message.includes("Wrong group number"), "Unexpected error message");
        }
    });
});

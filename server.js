const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fs = require('fs');

require("dotenv").config();

// Importing the models
const Mentor = require("./Models/Mentor");
const Student = require("./Models/Student");


const app = express();

const PORT = process.env.PORT;
const DB_URL = process.env.DB_URL;

app.use(bodyParser.json());


// Connecting to MongoDB
mongoose
    .connect(DB_URL, {})
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Could not connect to MongoDB", err));


app.get("/", (req, res) => {
    const filePath = './task.txt';
    
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error(`Error reading file: ${err}`);
        res.status(500).send('Internal Server Error');
      } else {
        const formattedData = data.replace(/\r\n|\r/g, '\n');
        const htmlContent = formattedData.replace(/\n/g, '<br>');
        res.status(200).send(htmlContent);
      }
    });
});

// Create Mentor
app.post("/mentor", async (req, res) => {
    try {
      const mentor = new Mentor(req.body);
      await mentor.save();
      res.status(201).send(mentor);
    } catch (error) {
      res.status(400).send(error);
    }
});


// Create Student
app.post("/student", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});


// Assigning Mentor
app.post("/mentor/:mentorId/assign", async (req, res) => {
    try {
      const mentor = await Mentor.findById(req.params.mentorId);
      const students = await Student.find({ _id: { $in: req.body.students } });
  
      students.forEach((student) => {
        student.cMentor = mentor._id;
        student.save();
      });
  
      mentor.students = [
        ...mentor.students,
        ...students.map((student) => student._id),
      ];
      await mentor.save();
      res.send(mentor);
    } catch (error) {
      res.status(400).send(error);
    }
});


// Assigning and Changing Mentor
app.put("/student/:studentId/assignMentor/:mentorId", async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId);
    const student = await Student.findById(req.params.studentId);

    if (student.cMentor) {
      student.pMentor.push(student.cMentor);
    }

    student.cMentor = mentor._id;
    await student.save();
    res.send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});
  

// Show all students for a particular Mentor
app.get("/mentor/:mentorId/students", async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId).populate(
      "students"
    );
    res.send(mentor);
  } catch (error) {
    res.status(400).send(error);
  }
});


// Show Previously assigned mentor for a particular Student
app.get("/student/previousmentor/:studentId", async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).populate(
      "pMentor"
    );
    res.send(student);
  } catch (error) {
    res.status(400).send(error);
  }
});



app.listen(PORT, ()=> {
    console.log("Server running on PORT: ",PORT);
});
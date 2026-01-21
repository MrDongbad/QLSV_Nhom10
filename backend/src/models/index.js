const mongoose = require('mongoose');

// 1. Schema Tài Khoản
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '123456' },
  role: { type: String, enum: ['ADMIN', 'TEACHER', 'STUDENT'], required: true },
  originalId: { type: String } 
});

// 2. Schema Lớp
const ClassSchema = new mongoose.Schema({
  classId: { type: String, required: true, unique: true },
  className: { type: String, required: true }
});

// 3. Schema Sinh Viên
const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String },
  classId: { type: String },
  email: { type: String }
});

// 4. Schema Điểm
const GradeSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  classId: { type: String, required: true },
  semester: { type: String },
  subjectName: { type: String },
  score: { type: Number },
  credit: { type: Number, default: 3 }
});

const User = mongoose.model('User', UserSchema);
const Class = mongoose.model('Class', ClassSchema);
const Student = mongoose.model('Student', StudentSchema);
const Grade = mongoose.model('Grade', GradeSchema);

module.exports = { User, Class, Student, Grade };
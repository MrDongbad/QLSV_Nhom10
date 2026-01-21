const fs = require('fs');
const mongoose = require('mongoose');

// Kết nối DB
const MONGO_URI = 'mongodb://127.0.0.1:27017/qlsv_nhom5';

// 1. Định nghĩa lại Schema (Đầy đủ cả Class)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, default: '123456' },
  role: { type: String, required: true },
  originalId: { type: String } 
});

const ClassSchema = new mongoose.Schema({
  classId: { type: String, required: true },
  className: { type: String, required: true }
});

const StudentSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, 
  fullName: { type: String, required: true },
  dob: { type: Date },
  gender: { type: String },
  classId: { type: String, required: true },
  email: { type: String }
});

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

// Hàm làm sạch dữ liệu SQL
const cleanSqlVal = (val) => {
    if (!val) return null;
    return val.trim().replace(/^'|'$/g, '');
};

const migrate = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Đã kết nối MongoDB.");

        const sqlContent = fs.readFileSync('./qlsv.sql', 'utf8');
        
        // Dọn sạch dữ liệu cũ
        await User.deleteMany({});
        await Class.deleteMany({});
        await Student.deleteMany({});
        await Grade.deleteMany({});
        console.log("🗑️  Đã dọn sạch DB cũ.");

        // ========================================================
        // 1. IMPORT LỚP
        // ========================================================
        const classRegex = /INSERT INTO `lop`.*?VALUES\s*([\s\S]*?);/g;
        let classMatch;
        let totalClasses = 0;

        while ((classMatch = classRegex.exec(sqlContent)) !== null) {
            const rows = classMatch[1].match(/\((.*?)\)/g);
            if (rows) {
                const classDocs = rows.map(row => {
                    const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
                    const parts = cleanRow.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/);
                    return {
                        classId: cleanSqlVal(parts[0]),
                        className: cleanSqlVal(parts[1])
                    };
                });
                await Class.insertMany(classDocs);
                totalClasses += classDocs.length;
            }
        }
        console.log(`🏫 Đã import ${totalClasses} lớp học.`);

        // ========================================================
        // 2. IMPORT TÀI KHOẢN (Map ID -> Email)
        // ========================================================
        const accRegex = /INSERT INTO `taikhoan`.*?VALUES\s*([\s\S]*?);/g;
        let accMatch;
        const accountMap = {}; // Map ID tài khoản (1, 2, 3...) -> Email
        const idMap = {};      // Map ID tài khoản -> Role
        let totalUsers = 0;

        while ((accMatch = accRegex.exec(sqlContent)) !== null) {
            const rows = accMatch[1].match(/\((.*?)\)/g);
            if (rows) {
                const userDocs = [];
                rows.forEach(row => {
                    const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
                    const parts = cleanRow.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/);
                    const id = cleanSqlVal(parts[0]);
                    const email = cleanSqlVal(parts[1]);
                    const role = cleanSqlVal(parts[3]);
                    
                    // Lưu tạm để tí nữa update lại originalId thành Mã SV
                    accountMap[id] = email;
                    idMap[id] = role;

                    // Tạm thời chưa insert User vội, đợi có Mã SV đã
                });
            }
        }
        
        // ========================================================
        // 3. IMPORT SINH VIÊN (Và tạo User tương ứng)
        // ========================================================
        const svRegex = /INSERT INTO `sinhvien`.*?VALUES\s*([\s\S]*?);/g;
        let svMatch;
        let totalStudents = 0;
        const studentUserMap = {}; // Map Email -> Mã SV

        while ((svMatch = svRegex.exec(sqlContent)) !== null) {
            const rows = svMatch[1].match(/\((.*?)\)/g);
            if (rows) {
                const svDocs = [];
                rows.forEach(row => {
                    const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
                    const parts = cleanRow.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/);
                    
                    const masv = cleanSqlVal(parts[0]);
                    const taikhoan_id = cleanSqlVal(parts[5]);
                    const email = accountMap[taikhoan_id] || '';

                    svDocs.push({
                        studentId: masv,
                        fullName: cleanSqlVal(parts[1]),
                        dob: new Date(cleanSqlVal(parts[2])),
                        gender: cleanSqlVal(parts[3]),
                        classId: cleanSqlVal(parts[4]),
                        email: email
                    });

                    // Lưu mapping để tạo User chuẩn
                    if (email) {
                        studentUserMap[email] = masv;
                    }
                });
                await Student.insertMany(svDocs);
                totalStudents += svDocs.length;
            }
        }
        console.log(`🎓 Đã import ${totalStudents} sinh viên.`);

        // GIỜ MỚI TẠO USER (Cập nhật originalId thành Mã SV)
        const finalUsers = [];
        for (const [id, email] of Object.entries(accountMap)) {
            const role = idMap[id];
            let finalId = id; // Mặc định là ID số

            if (role === 'STUDENT' && studentUserMap[email]) {
                finalId = studentUserMap[email]; // Nếu là SV thì lấy Mã SV (SV01...)
            } else if (role === 'ADMIN') {
                finalId = 'admin';
            } else if (role === 'TEACHER') {
                finalId = 'gv01'; // Demo
            }

            finalUsers.push({
                email: email,
                password: '123456',
                role: role,
                originalId: finalId // Quan trọng: Đây sẽ là SV01, SV003...
            });
        }
        await User.insertMany(finalUsers);
        console.log(`👤 Đã import ${finalUsers.length} tài khoản (Đã map Mã SV).`);

        // ========================================================
        // 4. IMPORT ĐIỂM
        // ========================================================
        const diemRegex = /INSERT INTO `diem`.*?VALUES\s*([\s\S]*?);/g;
        let diemMatch;
        let totalGrades = 0;

        while ((diemMatch = diemRegex.exec(sqlContent)) !== null) {
             const rows = diemMatch[1].match(/\((.*?)\)/g);
             if (rows) {
                 const gradeDocs = rows.map(row => {
                    const cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
                    const parts = cleanRow.split(/,\s*(?=(?:[^']*'[^']*')*[^']*$)/);
                    return {
                        studentId: cleanSqlVal(parts[1]),
                        classId: cleanSqlVal(parts[2]),
                        semester: cleanSqlVal(parts[3]),
                        subjectName: cleanSqlVal(parts[4]),
                        score: parseFloat(cleanSqlVal(parts[5])),
                        credit: 3
                    };
                 });
                 await Grade.insertMany(gradeDocs);
                 totalGrades += gradeDocs.length;
             }
        }
        console.log(`📊 Đã import ${totalGrades} điểm số.`);

        console.log("🎉 XONG! Dữ liệu đã được Chuẩn hóa 100%.");
        process.exit();
    } catch (err) {
        console.error("❌ Lỗi:", err);
        process.exit(1);
    }
};

migrate();
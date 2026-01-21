const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { User, Student, Grade, Class } = require('./src/models');

const app = express();
app.use(cors());
app.use(express.json());

/// --- CẤU HÌNH API KEY (Dán Key của bạn vào đây) ---
const API_KEY = "AIzaSyA3s1uCXOoop2SqgGDfGqxZHeIxjMt4uUM"; 

// Kết nối MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/qlsv_nhom5')
  .then(() => console.log('✅ Server: Đã kết nối MongoDB qlsv_nhom5'))
  .catch(err => console.error('❌ Server: Lỗi kết nối DB', err));

// ==================================================================
// HÀM AI DỰ PHÒNG (NÂNG CẤP THÔNG MINH HƠN)
// ==================================================================
function fallbackAI(question, grades, studentName) {
    const q = question.toLowerCase();
    
    // 1. Hỏi về GPA / Điểm trung bình
    if (q.includes('gpa') || q.includes('trung bình') || q.includes('tổng kết')) {
        let totalScore = 0;
        let totalCredit = 0;
        grades.forEach(g => {
            const credit = g.credit || 3; // Mặc định 3 tín chỉ nếu thiếu
            totalScore += g.score * credit;
            totalCredit += credit;
        });
        const gpa = totalCredit > 0 ? (totalScore / totalCredit).toFixed(2) : 0.0;
        
        let xepLoai = '';
        if (gpa >= 9.0) xepLoai = 'Xuất sắc';
        else if (gpa >= 8.0) xepLoai = 'Giỏi';
        else if (gpa >= 6.5) xepLoai = 'Khá';
        else if (gpa >= 5.0) xepLoai = 'Trung bình';
        else xepLoai = 'Yếu';

        return `GPA (Điểm trung bình tích lũy) hiện tại của ${studentName} là: ${gpa}. Xếp loại học lực: ${xepLoai}.`;
    }

    // 2. Hỏi về quy chế điểm (Khá, Giỏi, Trượt) - Kiến thức chung
    if (q.includes('bao nhiêu') || q.includes('là gì') || q.includes('thế nào')) {
        if (q.includes('giỏi')) return "Theo quy chế, để đạt loại Giỏi, bạn cần có điểm trung bình (GPA) từ 8.0 đến 8.9 (hoặc điểm chữ A).";
        if (q.includes('xuất sắc')) return "Loại Xuất sắc yêu cầu GPA từ 9.0 đến 10.0 (hoặc điểm chữ A+).";
        if (q.includes('khá')) return "Để đạt loại Khá, GPA của bạn cần nằm trong khoảng 6.5 đến 7.9 (hoặc điểm chữ B).";
        if (q.includes('trung bình')) return "Loại Trung bình là từ 5.0 đến 6.4. Cố gắng lên Khá nhé!";
        if (q.includes('trượt') || q.includes('rớt') || q.includes('học lại')) return "Thông thường, điểm tổng kết môn học dưới 4.0 (điểm F) là trượt môn và phải đăng ký học lại. Hãy cẩn thận!";
        if (q.includes('qua môn')) return "Để qua môn, bạn cần đạt điểm tổng kết môn học từ 4.0 (điểm D) trở lên.";
    }

    // 3. Hỏi về trượt/qua môn (Cụ thể của sinh viên này)
    if (q.includes('trượt') || q.includes('rớt') || q.includes('lại') || q.includes('f')) {
        // Giả sử mốc trượt là < 5.0 (hoặc 4.0 tùy trường, ở đây để 5.0 cho an toàn)
        const failed = grades.filter(g => g.score < 5);
        if (failed.length === 0) return `Tuyệt vời! ${studentName} hiện không trượt môn nào cả. Giữ vững phong độ nhé!`;
        return `Bạn cần lưu ý, hiện có ${failed.length} môn điểm thấp (<5): ${failed.map(g => g.subjectName + ' (' + g.score + ')').join(', ')}.`;
    }

    // 4. Hỏi cao nhất/thấp nhất
    if (q.includes('cao nhất') || q.includes('max') || q.includes('đỉnh nhất')) {
        if (grades.length === 0) return "Bạn chưa có điểm môn nào.";
        const max = grades.reduce((prev, curr) => (prev.score > curr.score) ? prev : curr);
        return `Môn cao điểm nhất của bạn là: ${max.subjectName} với số điểm ấn tượng: ${max.score} điểm. Quá đỉnh!`;
    }
    
    if (q.includes('thấp nhất') || q.includes('min') || q.includes('tệ nhất')) {
        if (grades.length === 0) return "Bạn chưa có điểm môn nào.";
        const min = grades.reduce((prev, curr) => (prev.score < curr.score) ? prev : curr);
        return `Môn thấp điểm nhất hiện tại là: ${min.subjectName} (${min.score} điểm). Cần cải thiện môn này nhé.`;
    }

    // 5. Hỏi về điểm cụ thể của một môn
    if (q.includes('điểm') || q.includes('mấy') || q.includes('xem')) {
        // Tìm xem trong câu hỏi có tên môn học nào không
        for (const g of grades) {
            // Chuẩn hóa tên môn để so sánh dễ hơn (bỏ dấu, viết thường...) nếu cần
            // Ở đây so sánh tương đối: tên môn trong DB có nằm trong câu hỏi không
            const cleanSubjectName = g.subjectName.toLowerCase();
            // Xử lý các từ khóa tắt: "web" -> "lập trình web"
            if (q.includes(cleanSubjectName) || 
               (cleanSubjectName.includes('web') && q.includes('web')) ||
               (cleanSubjectName.includes('cơ sở dữ liệu') && (q.includes('csdl') || q.includes('cơ sở dữ liệu'))) ||
               (cleanSubjectName.includes('mạng') && q.includes('mạng'))) {
                
                return `Điểm môn ${g.subjectName} của bạn là: ${g.score}. ${g.score >= 8 ? 'Điểm cao đấy!' : g.score >= 5 ? 'Đã qua môn.' : 'Chưa đạt yêu cầu.'}`;
            }
        }
        // Nếu hỏi "điểm" chung chung mà không khớp môn nào
        return `Bạn muốn xem điểm môn nào? Hiện tại tớ thấy bạn có điểm các môn: ${grades.map(g => g.subjectName).join(', ')}.`;
    }

    // 6. Chào hỏi
    if (q.includes('chào') || q.includes('hello') || q.includes('hi') || q.includes('alo')) {
        return `Chào ${studentName}! Tớ là trợ lý ảo học tập. Bạn cần tra cứu GPA, điểm môn học hay quy chế thi?`;
    }

    // 7. Fallback cuối cùng
    return `Tớ chưa hiểu rõ câu hỏi. Bạn thử hỏi: "GPA của tớ", "Điểm môn Web", "Bao nhiêu điểm là giỏi", hoặc "Có trượt môn nào không" xem sao nhé!`;
}
// ==================================================================

// --- API 1: ĐĂNG NHẬP ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ $or: [{ email: username }, { originalId: username }] });
        if (!user) {
            const student = await Student.findOne({ studentId: username });
            if (student) user = await User.findOne({ email: student.email });
        }
        if (!user || user.password !== password) return res.status(401).json({ message: 'Sai thông tin' });

        let fullName = username;
        let finalId = user.originalId;
        let classId = '';

        if (user.role === 'STUDENT') {
            const sv = await Student.findOne({ studentId: user.originalId });
            if (sv) { 
                fullName = sv.fullName; 
                finalId = sv.studentId;
                classId = sv.classId;
            }
        }
        res.json({ success: true, role: user.role.toLowerCase(), username: finalId, name: fullName, classId });
    } catch (err) { res.status(500).json({ message: 'Lỗi Server' }); }
});

// --- API 2: LẤY BẢNG ĐIỂM SINH VIÊN ---
app.get('/api/student/:id/grades', async (req, res) => {
    try {
        const grades = await Grade.find({ studentId: req.params.id });
        let totalScore = 0, totalCredit = 0;
        grades.forEach(g => {
            const credit = g.credit || 3;
            totalScore += g.score * credit;
            totalCredit += credit;
        });
        const gpa = totalCredit > 0 ? (totalScore / totalCredit).toFixed(2) : 0;
        res.json({ grades, gpa });
    } catch (err) { res.status(500).json({ message: 'Lỗi lấy điểm' }); }
});

// --- API 3: LẤY DANH SÁCH SINH VIÊN ---
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ _id: -1 });
        res.json(students);
    } catch (err) { res.status(500).json({ message: 'Lỗi lấy danh sách' }); }
});

// --- API 4: LẤY DANH SÁCH LỚP ---
app.get('/api/classes', async (req, res) => {
    try {
        const classes = await Class.find();
        res.json(classes);
    } catch (err) { res.status(500).json({ message: 'Lỗi lấy lớp' }); }
});

// --- API 5: LẤY DANH SÁCH MÔN HỌC & LỚP ---
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Grade.aggregate([
            { $group: { _id: "$subjectName", classes: { $addToSet: "$classId" } } },
            { $sort: { _id: 1 } }
        ]);
        const result = subjects.map(s => ({ subjectName: s._id, classes: s.classes.sort() }));
        res.json(result);
    } catch (err) { res.status(500).json({ message: 'Lỗi lấy môn' }); }
});

// --- API 6: LẤY ĐIỂM CỦA LỚP THEO MÔN ---
app.get('/api/teacher/grades', async (req, res) => {
    try {
        const { classId, subject } = req.query;
        console.log(`📡 Teacher request: Class=${classId}, Subject=${subject}`);
        const students = await Student.find({ classId: classId });
        const grades = await Grade.find({ classId: classId, subjectName: subject });
        const result = students.map(sv => {
            const gradeRecord = grades.find(g => g.studentId === sv.studentId);
            return {
                studentId: sv.studentId,
                fullName: sv.fullName,
                score: gradeRecord ? gradeRecord.score : '', 
                gradeId: gradeRecord ? gradeRecord._id : null
            };
        });
        res.json(result);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: 'Lỗi lấy bảng điểm lớp' }); 
    }
});

// --- API 7: CẬP NHẬT ĐIỂM ---
app.post('/api/teacher/update-grade', async (req, res) => {
    try {
        const { studentId, classId, subjectName, score } = req.body;
        let grade = await Grade.findOne({ studentId, subjectName, classId });
        if (grade) {
            grade.score = score;
            await grade.save();
        } else {
            await Grade.create({ studentId, classId, subjectName, score, semester: 'HK1', credit: 3 });
        }
        res.json({ success: true, message: 'Lưu thành công!' });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- API 8: THÊM SINH VIÊN ---
app.post('/api/students', async (req, res) => {
    try {
        const { studentId, fullName, dob, gender, classId, email } = req.body;
        if (await Student.findOne({ studentId })) return res.status(400).json({ message: 'Trùng mã SV!' });
        await Student.create({ studentId, fullName, dob, gender, classId, email });
        await User.create({ email: email || `${studentId.toLowerCase()}@sv.edu.vn`, password: '123456', role: 'STUDENT', originalId: studentId });
        res.json({ success: true, message: 'Thêm thành công!' });
    } catch (err) { res.status(500).json({ message: 'Lỗi thêm' }); }
});

// --- API 9: SỬA SINH VIÊN ---
app.put('/api/students/:id', async (req, res) => {
    try {
        await Student.updateOne({ studentId: req.params.id }, req.body);
        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (err) { res.status(500).json({ message: 'Lỗi cập nhật' }); }
});

// --- API 10: XÓA SINH VIÊN ---
app.delete('/api/students/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Student.deleteOne({ studentId: id });
        await User.deleteOne({ originalId: id });
        await Grade.deleteMany({ studentId: id });
        res.json({ success: true, message: 'Đã xóa!' });
    } catch (err) { res.status(500).json({ message: 'Lỗi xóa' }); }
});

// --- API 11: LẤY DANH SÁCH USER ---
app.get('/api/users', async (req, res) => {
    try { res.json(await User.find().sort({ _id: -1 })); } 
    catch (err) { res.status(500).json({ message: 'Lỗi lấy user' }); }
});

// --- API 12: TẠO USER ---
app.post('/api/users', async (req, res) => {
    try {
        if (await User.findOne({ email: req.body.email })) return res.status(400).json({ message: 'Email tồn tại!' });
        await User.create(req.body);
        res.json({ success: true, message: 'Tạo user thành công!' });
    } catch (err) { res.status(500).json({ message: 'Lỗi tạo user' }); }
});

// --- API 13: XÓA USER ---
app.delete('/api/users/:id', async (req, res) => {
    try { await User.findByIdAndDelete(req.params.id); res.json({ success: true }); }
    catch (err) { res.status(500).json({ message: 'Lỗi xóa' }); }
});

// --- API 14: ĐỔI MẬT KHẨU ---
app.put('/api/users/:id/reset-password', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { password: req.body.newPassword });
        res.json({ success: true, message: 'Đổi pass thành công!' });
    } catch (err) { res.status(500).json({ message: 'Lỗi đổi pass' }); }
});

// --- API 15: XÓA MÔN KHỎI LỚP ---
app.delete('/api/grades/remove-class', async (req, res) => {
    try {
        const { classId, subjectName } = req.body;
        await Grade.deleteMany({ classId: classId, subjectName: subjectName });
        res.json({ success: true, message: `Đã gỡ môn ${subjectName} khỏi lớp ${classId}` });
    } catch (err) { res.status(500).json({ message: 'Lỗi xóa dữ liệu' }); }
});

// --- API 16: AI CHATBOT (DÙNG FETCH TRỰC TIẾP + FALLBACK LOCAL) ---
app.post('/api/chat', async (req, res) => {
    const { studentId, question } = req.body;
    console.log(`💬 Chat: ${question}`);

    try {
        const grades = await Grade.find({ studentId });
        const student = await Student.findOne({ studentId });
        if (!student) return res.json({ answer: "Không tìm thấy thông tin của bạn." });

        const contextData = grades.map(g => `- Môn ${g.subjectName}: ${g.score} điểm`).join('\n');
        
        // 1. THỬ GỌI GOOGLE GEMINI (REST API)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [{
                    text: `Bạn là trợ lý học tập. Thông tin SV: ${student.fullName}. Bảng điểm:\n${contextData}\nCâu hỏi: "${question}"\nTrả lời ngắn gọn:`
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                console.log("🤖 Google AI trả lời:", text);
                return res.json({ answer: text });
            }
        }

        // 2. NẾU GOOGLE LỖI -> DÙNG AI TỰ CHẾ (FALLBACK)
        throw new Error("Google AI không phản hồi");

    } catch (err) {
        console.warn("⚠️ Google AI lỗi, chuyển sang chế độ Offline:", err.message);
        
        // Gọi hàm tự trả lời (Không cần mạng, không cần Key chuẩn)
        const grades = await Grade.find({ studentId });
        const student = await Student.findOne({ studentId });
        const localAnswer = fallbackAI(question, grades, student ? student.fullName : 'Bạn');
        
        console.log("🤖 Local AI trả lời:", localAnswer);
        res.json({ answer: localAnswer });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));
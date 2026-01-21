import { useState, useEffect } from 'react';
import { Edit3, Users, Book, LogOut, Save, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enter_scores');
  
  // State dữ liệu
  const [classes, setClasses] = useState<any[]>([]); 
  const [subjectsList, setSubjectsList] = useState<string[]>([]); // Danh sách tên môn học
  
  const [selectedClass, setSelectedClass] = useState(''); 
  const [subject, setSubject] = useState(''); 
  
  const [students, setStudents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  // 1. Lấy danh sách Lớp & Môn học khi vào trang
  useEffect(() => {
    // Lấy danh sách lớp
    fetch('http://localhost:5000/api/classes')
      .then(res => res.json())
      .then(data => {
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0].classId);
      })
      .catch(err => console.error(err));

    // Lấy danh sách môn học
    fetch('http://localhost:5000/api/subjects')
      .then(res => res.json())
      .then(data => {
        // Xử lý dữ liệu: API mới trả về Object { subjectName, classes }, ta chỉ cần lấy subjectName
        const names = data.map((item: any) => item.subjectName ? item.subjectName : item);
        
        setSubjectsList(names);
        if (names.length > 0) setSubject(names[0]);
      })
      .catch(err => console.error(err));
  }, []);

  // 2. Khi người dùng bấm nút "Lấy danh sách" (ĐÃ SỬA: Encode tham số URL)
  const fetchStudentsAndGrades = async () => {
      if (!selectedClass || !subject) {
          alert("Vui lòng chọn Lớp và Môn học!");
          return;
      }

      setLoading(true);
      try {
          // encodeURIComponent giúp xử lý tiếng Việt và khoảng trắng trong URL
          const url = `http://localhost:5000/api/teacher/grades?classId=${encodeURIComponent(selectedClass)}&subject=${encodeURIComponent(subject)}`;
          
          const res = await fetch(url);
          const data = await res.json();
          setStudents(data);
      } catch (error) {
          console.error("Lỗi lấy danh sách:", error);
      } finally {
          setLoading(false);
      }
  };

  // Xử lý sửa điểm trên giao diện
  const handleScoreChange = (studentId: string, newScore: string) => {
      const updatedStudents = students.map(sv => {
          if (sv.studentId === studentId) {
              return { ...sv, score: newScore };
          }
          return sv;
      });
      setStudents(updatedStudents);
  };

  // Lưu điểm
  const saveGrade = async (studentId: string, score: any) => {
      if(score === '') return;
      try {
          const res = await fetch('http://localhost:5000/api/teacher/update-grade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  studentId,
                  classId: selectedClass,
                  subjectName: subject,
                  score: parseFloat(score),
                  semester: 'HK1' 
              })
          });
          const data = await res.json();
          if(data.success) {
              alert(`Đã lưu điểm cho SV ${studentId}`);
          }
      } catch (error) {
          alert('Lỗi khi lưu điểm');
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Book className="text-blue-600"/> Cổng Giảng Viên
          </h1>
          <button onClick={() => navigate('/')} className="text-red-500 hover:text-red-700 flex items-center gap-1 font-medium text-sm">
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
            <div onClick={() => setActiveTab('enter_scores')} className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium ${activeTab === 'enter_scores' ? 'bg-blue-100 text-blue-700' : 'bg-white hover:bg-gray-50 text-gray-600'}`}>
                <Edit3 size={18}/> Nhập điểm
            </div>
            <div className="p-3 rounded-lg flex items-center gap-3 font-medium text-gray-400 cursor-not-allowed">
                <Users size={18}/> Danh sách SV (Coming soon)
            </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
            {/* Bộ lọc */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Search size={18}/> Bộ lọc nhập điểm</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CHỌN LỚP */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Chọn Lớp</label>
                        <select 
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {classes.length === 0 && <option>Đang tải...</option>}
                            {classes.map((c: any) => (
                                <option key={c.classId} value={c.classId}>{c.className} ({c.classId})</option>
                            ))}
                        </select>
                    </div>

                    {/* CHỌN MÔN HỌC */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Môn học</label>
                        <select 
                            className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        >
                            {subjectsList.length === 0 && <option>Đang tải...</option>}
                            {subjectsList.map((sub, index) => (
                                <option key={index} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button 
                            onClick={fetchStudentsAndGrades}
                            className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm active:scale-95 transition"
                        >
                            Lấy danh sách
                        </button>
                    </div>
                </div>
            </div>

            {/* Bảng danh sách */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Danh sách sinh viên</h2>
                    <span className="text-sm text-gray-500">Tìm thấy: {students.length} sinh viên</span>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-400">Đang tải dữ liệu...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-3 text-sm font-bold text-gray-600">Mã SV</th>
                                <th className="p-3 text-sm font-bold text-gray-600">Họ Tên</th>
                                <th className="p-3 text-sm font-bold text-gray-600 text-center">Điểm số</th>
                                <th className="p-3 text-sm font-bold text-gray-600 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? students.map((sv) => (
                                <tr key={sv.studentId} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{sv.studentId}</td>
                                    <td className="p-3">{sv.fullName}</td>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="number" 
                                            className="border border-gray-300 rounded px-2 py-1 w-20 text-center font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                                            value={sv.score}
                                            onChange={(e) => handleScoreChange(sv.studentId, e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={() => saveGrade(sv.studentId, sv.score)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded transition" 
                                            title="Lưu điểm này"
                                        >
                                            <Save size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                        Chọn Lớp và Môn học rồi bấm "Lấy danh sách"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
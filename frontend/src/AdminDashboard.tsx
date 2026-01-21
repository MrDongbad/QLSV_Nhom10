import { useState, useEffect } from 'react';
import { Users, BookOpen, Settings, LogOut, Plus, Trash2, Edit, Search, X, RefreshCcw, Filter, ChevronRight, Lock, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  
  // Data State
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]); 
  const [users, setUsers] = useState<any[]>([]); // Dữ liệu tài khoản
  const [loading, setLoading] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Modal State (Dùng chung cho Sinh viên & Tài khoản)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'student' | 'user' | 'reset_pass'
  
  // Form Data Sinh viên
  const [formData, setFormData] = useState({
      studentId: '', fullName: '', dob: '', gender: 'Nam', classId: '', email: ''
  });
  
  // Form Data User
  const [userForm, setUserForm] = useState({
      email: '', password: '123456', role: 'TEACHER', originalId: ''
  });

  // State Reset Password
  const [resetPassData, setResetPassData] = useState({ userId: '', newPassword: '' });

  const [isEdit, setIsEdit] = useState(false);

  // Load dữ liệu
  useEffect(() => {
    if (activeTab === 'students') { fetchStudents(); fetchClasses(); }
    if (activeTab === 'subjects') { fetchSubjects(); }
    if (activeTab === 'accounts') { fetchUsers(); }
  }, [activeTab]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/students?_t=${Date.now()}`);
      const data = await res.json();
      setStudents(data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const fetchClasses = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/classes');
          const data = await res.json();
          setClasses(data);
          if(data.length > 0) setFormData(prev => ({ ...prev, classId: data[0].classId }));
      } catch (error) { console.error(error); }
  };

  const fetchSubjects = async () => {
      try {
          const res = await fetch('http://localhost:5000/api/subjects');
          const data = await res.json();
          setSubjects(data); 
      } catch (error) { console.error(error); }
  };

  const fetchUsers = async () => {
      setLoading(true);
      try {
          const res = await fetch('http://localhost:5000/api/users');
          const data = await res.json();
          setUsers(data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
  };

  // --- LOGIC LỌC SINH VIÊN ---
  const filteredStudents = students.filter(sv => {
    const matchSearch = sv.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sv.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = filterClass ? sv.classId === filterClass : true;
    return matchSearch && matchClass;
  });

  // --- XỬ LÝ SINH VIÊN ---
  const handleDeleteStudent = async (id: string) => {
      if(!window.confirm(`Xóa sinh viên ${id}?`)) return;
      try {
          const res = await fetch(`http://localhost:5000/api/students/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if(data.success) { alert(data.message); fetchStudents(); }
      } catch (error) { alert('Lỗi khi xóa!'); }
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
      e.preventDefault();
      const url = isEdit ? `http://localhost:5000/api/students/${formData.studentId}` : 'http://localhost:5000/api/students';
      const method = isEdit ? 'PUT' : 'POST';
      try {
          const res = await fetch(url, {
              method: method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });
          const data = await res.json();
          if(data.success) {
              alert(data.message);
              setShowModal(false);
              fetchStudents();
              setFormData({ studentId: '', fullName: '', dob: '', gender: 'Nam', classId: classes[0]?.classId || '', email: '' });
          } else { alert(data.message); }
      } catch (error) { alert('Lỗi xử lý!'); }
  };

  // --- XỬ LÝ TÀI KHOẢN ---
  const handleDeleteUser = async (id: string) => {
      if(!window.confirm(`Xóa tài khoản này?`)) return;
      try {
          const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if(data.success) { alert(data.message); fetchUsers(); }
      } catch (error) { alert('Lỗi xóa user!'); }
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch('http://localhost:5000/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(userForm)
          });
          const data = await res.json();
          if(data.success) {
              alert(data.message);
              setShowModal(false);
              fetchUsers();
              setUserForm({ email: '', password: '123456', role: 'TEACHER', originalId: '' });
          } else { alert(data.message); }
      } catch (error) { alert('Lỗi tạo user!'); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`http://localhost:5000/api/users/${resetPassData.userId}/reset-password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newPassword: resetPassData.newPassword })
          });
          const data = await res.json();
          if(data.success) { alert(data.message); setShowModal(false); }
      } catch (error) { alert('Lỗi đổi mật khẩu!'); }
  };

  // --- HELPER MỞ MODAL ---
  const openStudentModal = (editMode = false, sv: any = null) => {
      setModalType('student');
      setIsEdit(editMode);
      if (editMode && sv) {
          setFormData({
              studentId: sv.studentId, fullName: sv.fullName, dob: sv.dob ? sv.dob.split('T')[0] : '',
              gender: sv.gender, classId: sv.classId, email: sv.email
          });
      } else {
          setFormData({ studentId: '', fullName: '', dob: '', gender: 'Nam', classId: classes[0]?.classId || '', email: '' });
      }
      setShowModal(true);
  };

  const openUserModal = () => {
      setModalType('user');
      setUserForm({ email: '', password: '123456', role: 'TEACHER', originalId: '' });
      setShowModal(true);
  };

  const openResetPassModal = (user: any) => {
      setModalType('reset_pass');
      setResetPassData({ userId: user._id, newPassword: '' });
      setShowModal(true);
  };

  const jumpToClass = (classId: string) => {
      setActiveTab('students');
      setFilterClass(classId);
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'students':
              return (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                <input 
                                    type="text" placeholder="Tìm tên, mã SV..." 
                                    className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative w-48">
                                <Filter className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                                <select 
                                    className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                                    value={filterClass}
                                    onChange={(e) => setFilterClass(e.target.value)}
                                >
                                    <option value="">-- Tất cả lớp --</option>
                                    {classes.map((c: any) => (
                                        <option key={c.classId} value={c.classId}>{c.className}</option>
                                    ))}
                                </select>
                            </div>
                            <span className="text-sm text-gray-500 italic">{filteredStudents.length} kết quả</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={fetchStudents} className="bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"><RefreshCcw size={18}/></button>
                            <button onClick={() => openStudentModal(false)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Thêm mới</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Mã SV</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Họ Tên</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Ngày sinh</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Giới tính</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Lớp</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map((sv) => (
                            <tr key={sv.studentId} className="border-b hover:bg-blue-50 transition group">
                                <td className="p-4 font-bold text-blue-600">{sv.studentId}</td>
                                <td className="p-4 font-medium text-gray-800">{sv.fullName}</td>
                                <td className="p-4 text-gray-600">{sv.dob ? new Date(sv.dob).toLocaleDateString('vi-VN') : '-'}</td>
                                <td className="p-4 text-gray-600">{sv.gender}</td>
                                <td className="p-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border">{sv.classId}</span></td>
                                <td className="p-4 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => openStudentModal(true, sv)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteStudent(sv.studentId)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                            )) : (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu</td></tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
              );

          case 'subjects':
              return (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BookOpen className="text-green-600"/> Danh sách Môn học & Lớp học phần
                    </h2>
                    <div className="grid gap-4">
                        {subjects.map((sub, index) => (
                            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition bg-gray-50 flex justify-between items-center group">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                                            {index + 1}
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-800">{sub.subjectName}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 ml-14">
                                        Hiện đang được giảng dạy tại các lớp:
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {sub.classes.length > 0 ? sub.classes.map((cls: string) => (
                                        <div key={cls} className="flex items-center bg-white border border-blue-200 rounded-full pl-3 pr-1 py-1 gap-1 shadow-sm hover:border-blue-400 transition group/tag">
                                            <span 
                                                className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                                                onClick={() => jumpToClass(cls)}
                                                title="Xem danh sách lớp này"
                                            >
                                                {cls}
                                            </span>
                                            {/* NÚT XÓA LỚP KHỎI MÔN */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeClassFromSubject(cls, sub.subjectName);
                                                }}
                                                className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-500 transition ml-1"
                                                title="Xóa lớp khỏi môn này (Xóa hết điểm)"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )) : <span className="text-sm text-gray-400 italic">Chưa có lớp học</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              );
          
          case 'accounts':
              return (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Settings className="text-purple-600"/> Quản lý Tài khoản Hệ thống
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={fetchUsers} className="bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"><RefreshCcw size={18}/></button>
                            <button onClick={openUserModal} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"><Plus size={18} /> Tạo User mới</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Email / Tên đăng nhập</th>
                                    <th className="p-4 font-semibold text-gray-600">Vai trò</th>
                                    <th className="p-4 font-semibold text-gray-600">Mã liên kết</th>
                                    <th className="p-4 font-semibold text-gray-600 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id} className="border-b hover:bg-purple-50 transition">
                                        <td className="p-4 font-medium">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                                                u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">{u.originalId || '-'}</td>
                                        <td className="p-4 flex gap-2 justify-end">
                                            <button onClick={() => openResetPassModal(u)} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg flex items-center gap-1" title="Đổi mật khẩu">
                                                <Key size={16}/> Pass
                                            </button>
                                            <button onClick={() => handleDeleteUser(u._id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              );
          
          default: return null;
      }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="w-64 bg-blue-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-2xl font-bold flex items-center gap-2 border-b border-blue-800">
           <Settings /> ADMIN
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['students', 'subjects', 'accounts'].map(tab => (
             <div key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition capitalize ${activeTab === tab ? 'bg-blue-700 shadow-md' : 'hover:bg-blue-800 text-blue-100'}`}>
                {tab === 'students' && <Users size={20}/>}
                {tab === 'subjects' && <BookOpen size={20}/>}
                {tab === 'accounts' && <Settings size={20}/>}
                {tab === 'students' ? 'Sinh viên' : tab === 'subjects' ? 'Môn học' : 'Tài khoản'}
             </div>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button onClick={() => navigate('/')} className="flex items-center justify-center gap-2 text-red-200 hover:text-white py-2 px-4 rounded-lg w-full transition">
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto relative">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-tight">
                {activeTab === 'students' ? 'QUẢN LÝ SINH VIÊN' : 
                 activeTab === 'subjects' ? 'QUẢN LÝ MÔN HỌC' : 'TÀI KHOẢN HỆ THỐNG'}
            </h1>
            <p className="text-gray-500 mt-1">Hệ thống quản lý đào tạo tập trung</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border font-semibold text-gray-700 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500"></div> Administrator
          </div>
        </header>

        {renderContent()}

        {/* MODAL FORM */}
        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {modalType === 'student' ? (isEdit ? 'Cập nhật Sinh viên' : 'Thêm Sinh viên mới') : 
                             modalType === 'user' ? 'Tạo Tài khoản mới' : 'Đặt lại Mật khẩu'}
                        </h2>
                        <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
                    </div>
                    
                    {/* FORM SINH VIÊN */}
                    {modalType === 'student' && (
                        <form onSubmit={handleSubmitStudent} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã sinh viên (*)</label>
                                    <input type="text" required disabled={isEdit} className={`w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lớp (*)</label>
                                    <select className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={formData.classId} onChange={(e) => setFormData({...formData, classId: e.target.value})}
                                    >
                                        {classes.map((c: any) => <option key={c.classId} value={c.classId}>{c.classId}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên (*)</label>
                                <input type="text" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                    <input type="date" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                                    <select className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                    >
                                        <option value="Nam">Nam</option>
                                        <option value="Nu">Nữ</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg mt-4">
                                {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
                            </button>
                        </form>
                    )}

                    {/* FORM USER */}
                    {modalType === 'user' && (
                        <form onSubmit={handleSubmitUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email đăng nhập (*)</label>
                                <input type="email" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500"
                                    value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mặc định</label>
                                    <input type="text" disabled className="w-full border rounded-lg p-2 bg-gray-100" value="123456" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                    <select className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                        value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                                    >
                                        <option value="TEACHER">Giáo viên</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mã liên kết (Mã GV/Admin)</label>
                                <input type="text" className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="VD: GV001, AD002..."
                                    value={userForm.originalId} onChange={(e) => setUserForm({...userForm, originalId: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition shadow-lg mt-4">Tạo Tài Khoản</button>
                        </form>
                    )}

                    {/* FORM RESET PASS */}
                    {modalType === 'reset_pass' && (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                                <input type="text" required className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="Nhập mật khẩu mới..."
                                    value={resetPassData.newPassword} onChange={(e) => setResetPassData({...resetPassData, newPassword: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full bg-yellow-500 text-white py-3 rounded-lg font-bold hover:bg-yellow-600 transition shadow-lg mt-4">Xác nhận đổi mật khẩu</button>
                        </form>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
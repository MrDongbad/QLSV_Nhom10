import React, { useState } from 'react';
import { GraduationCap, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Gọi API Backend
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // --- QUAN TRỌNG: Lưu đầy đủ thông tin vào LocalStorage ---
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data.username); // Đây là Mã SV (SV999)
        localStorage.setItem('userName', data.name);   // Đây là Tên thật (Nguyễn Văn Test)
        
        // Lưu thông tin lớp học (nếu có)
        if (data.classId) {
            localStorage.setItem('userClass', data.classId); // Lưu Lớp (CNTT_A)
        } else {
            localStorage.setItem('userClass', 'Chưa cập nhật');
        }
        // ---------------------------------------------------------

        // Chuyển trang theo quyền hạn
        if (data.role === 'admin') navigate('/admin');
        else if (data.role === 'teacher') navigate('/teacher');
        else navigate('/student');
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Không kết nối được Server Backend!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-blue-500">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mb-3 shadow-inner">
            <GraduationCap size={48} className="text-blue-700" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">EduManage AI</h1>
          <p className="text-gray-500 text-sm mt-1">Hệ thống quản lý đào tạo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded text-sm text-center">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Tên đăng nhập</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập Mã SV hoặc Email"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg transform active:scale-95 transition-all duration-200 disabled:bg-blue-400"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
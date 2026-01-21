import { useState, useEffect, useRef } from 'react';
import { GraduationCap, BookOpen, User, Bot, LogOut, Star, Send, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my_grades');
  
  const [studentInfo, setStudentInfo] = useState({ name: '', id: '', classId: '' });
  const [grades, setGrades] = useState<any[]>([]);
  const [gpa, setGpa] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO CHATBOT ---
  const [messages, setMessages] = useState<{sender: 'user'|'bot', text: string}[]>([
      { sender: 'bot', text: 'Chào bạn! Tớ là trợ lý AI. Bạn muốn hỏi gì về điểm số không?' }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
      if (activeTab === 'chat_bot') {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, activeTab, isChatting]);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedId = localStorage.getItem('userId');
    const storedClass = localStorage.getItem('userClass');

    if (!storedId) {
      navigate('/'); 
      return;
    }

    setStudentInfo({ 
        name: storedName || 'Sinh viên', 
        id: storedId, 
        classId: storedClass || 'Chưa cập nhật'
    });

    fetch(`http://localhost:5000/api/student/${storedId}/grades`)
      .then(res => res.json())
      .then(data => {
        setGrades(data.grades);
        setGpa(data.gpa);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy điểm:", err);
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // --- HÀM GỬI CHAT (PHIÊN BẢN AN TOÀN) ---
  const handleSendChat = async () => {
      if (!inputChat.trim()) return;

      const userMsg = inputChat;
      setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
      setInputChat('');
      setIsChatting(true);

      try {
          const res = await fetch('http://localhost:5000/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  studentId: studentInfo.id, 
                  question: userMsg 
              })
          });
          
          // Kiểm tra xem Server có trả về JSON không
          const contentType = res.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Backend chưa có API Chat (Trả về HTML 404)");
          }

          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Lỗi Server');

          setMessages(prev => [...prev, { sender: 'bot', text: data.answer }]);
      } catch (error: any) {
          console.error("Lỗi Chatbot:", error);
          setMessages(prev => [...prev, { 
              sender: 'bot', 
              text: `⚠️ Lỗi: ${error.message}. Hãy đảm bảo bạn đã copy file Backend mới nhất và Restart Server!` 
          }]);
      } finally {
          setIsChatting(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col z-10">
         <div className="p-6 flex items-center gap-3 border-b border-gray-100">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><GraduationCap size={24}/></div>
            <span className="font-bold text-gray-800 text-lg tracking-tight">EduStudent</span>
         </div>
         
         <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-blue-50">
            <div className="w-20 h-20 bg-blue-200 rounded-full mb-3 flex items-center justify-center text-blue-600 font-bold text-2xl border-4 border-blue-50">
              {studentInfo.name.charAt(0)}
            </div>
            <h3 className="font-bold text-gray-800 text-center">{studentInfo.name}</h3>
            <p className="text-sm text-gray-500">{studentInfo.id}</p>
            <div className="mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                {studentInfo.classId}
            </div>
         </div>

         <nav className="flex-1 p-4 space-y-2">
            <div onClick={() => setActiveTab('my_grades')} className={`cursor-pointer p-3 rounded-lg flex items-center gap-3 font-medium transition ${activeTab === 'my_grades' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Star size={20}/> Bảng điểm
            </div>
             <div onClick={() => setActiveTab('chat_bot')} className={`cursor-pointer p-3 rounded-lg flex items-center gap-3 font-medium transition ${activeTab === 'chat_bot' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Bot size={20}/> AI Chatbot
            </div>
         </nav>

         <div className="p-4">
            <button onClick={handleLogout} className="w-full border border-red-200 text-red-500 p-2 rounded-lg hover:bg-red-50 flex justify-center items-center gap-2 font-medium transition">
                <LogOut size={18}/> Đăng xuất
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto h-screen flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Xin chào, {studentInfo.name}! 👋</h1>
                    <p className="text-gray-500 mt-1">
                        Hôm nay bạn muốn xem gì? 
                        <span className="ml-2 text-sm bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                            Lớp: {studentInfo.classId}
                        </span>
                    </p>
                </div>
            </div>

            {/* TAB BẢNG ĐIỂM */}
            {activeTab === 'my_grades' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 text-lg">Kết quả học tập</h3>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">GPA: {gpa}</span>
                    </div>
                    
                    {loading ? (
                        <div className="p-10 text-center text-gray-500">Đang tải dữ liệu từ Server...</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-sm font-bold text-gray-500">Môn học</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 text-center">Điểm số</th>
                                    <th className="p-4 text-sm font-bold text-gray-500 text-center">Tín chỉ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.length > 0 ? grades.map((g, idx) => (
                                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{g.subjectName}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block w-10 h-10 leading-10 rounded-full font-bold ${g.score >= 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {g.score}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-gray-500">{g.credit || 3}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="p-10 text-center text-red-500">
                                            Chưa có dữ liệu điểm cho sinh viên này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            
            {/* TAB CHATBOT AI */}
            {activeTab === 'chat_bot' && (
                 <div className="bg-white rounded-xl shadow-lg border border-purple-100 flex flex-col flex-1 overflow-hidden" style={{ maxHeight: '600px' }}>
                     <div className="bg-purple-600 p-4 text-white flex items-center gap-3">
                         <div className="bg-white p-2 rounded-full text-purple-600"><Bot size={24}/></div>
                         <div>
                             <h3 className="font-bold">Trợ lý học tập AI</h3>
                             <p className="text-xs opacity-80 text-purple-100">Luôn sẵn sàng hỗ trợ bạn</p>
                         </div>
                     </div>

                     <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
                         {messages.map((msg, idx) => (
                             <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                                     msg.sender === 'user' 
                                     ? 'bg-purple-600 text-white rounded-tr-none' 
                                     : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                 }`}>
                                     {msg.text}
                                 </div>
                             </div>
                         ))}
                         
                         {isChatting && (
                             <div className="flex justify-start">
                                 <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 flex items-center gap-2">
                                     <Loader size={16} className="animate-spin text-purple-600"/> 
                                     <span className="text-sm text-gray-500 italic">AI đang trả lời...</span>
                                 </div>
                             </div>
                         )}
                         <div ref={chatEndRef} />
                     </div>

                     <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                         <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none transition"
                            placeholder="Ví dụ: Điểm môn Web của tớ bao nhiêu?"
                            value={inputChat}
                            onChange={(e) => setInputChat(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                            disabled={isChatting}
                         />
                         <button 
                            onClick={handleSendChat}
                            disabled={isChatting || !inputChat.trim()}
                            className="bg-purple-600 text-white p-3 rounded-full hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg"
                         >
                             <Send size={20}/>
                         </button>
                     </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
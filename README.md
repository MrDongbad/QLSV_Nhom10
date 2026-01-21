Hệ Thống Quản Lý Sinh Viên Tích Hợp AI Chatbot (EduManage AI)

MERN Stack Project - Thực tập VTI Group

📖 Giới thiệu

Đây là dự án "Hệ thống quản lý sinh viên" được phát triển trong kỳ thực tập tại công ty VTI Group. Dự án nhằm mục đích số hóa quy trình quản lý đào tạo, hỗ trợ giảng viên nhập điểm và cung cấp công cụ tra cứu thông tin thông minh cho sinh viên thông qua AI Chatbot.

Điểm nổi bật:

Kiến trúc hiện đại: Sử dụng MERN Stack (MongoDB, Express.js, ReactJS, Node.js).

Phân quyền chặt chẽ: 3 vai trò riêng biệt (Admin, Teacher, Student).

Tích hợp AI: Sử dụng Google Gemini AI để trả lời các câu hỏi về điểm số và học tập của sinh viên.

Dữ liệu thực tế: Hệ thống có khả năng chuyển đổi (migrate) dữ liệu từ SQL cũ sang MongoDB.

🚀 Công nghệ sử dụng (Tech Stack)

Frontend (Client-side)

ReactJS (Vite): Xây dựng giao diện Single Page Application (SPA) tốc độ cao.

TypeScript: Tăng tính chặt chẽ và dễ bảo trì cho code.

TailwindCSS: Framework CSS giúp thiết kế giao diện nhanh và đẹp.

Lucide React: Bộ icon hiện đại.

React Router DOM: Quản lý điều hướng trang.

Backend (Server-side)

Node.js & Express.js: Xây dựng RESTful API.

MongoDB & Mongoose: Cơ sở dữ liệu NoSQL lưu trữ thông tin sinh viên, điểm số.

Google Generative AI SDK: Thư viện kết nối với mô hình AI Gemini.

CORS: Xử lý bảo mật chia sẻ tài nguyên.

📂 Cấu trúc dự án

BAITHUCTAP/
├── backend/                # SERVER API (Node.js)
│   ├── src/
│   │   └── models/         # Cấu trúc dữ liệu (Schema)
│   ├── index.js            # File chạy Server chính
│   ├── migrate.js          # Script chuyển đổi dữ liệu SQL -> Mongo
│   └── qlsv.sql            # Dữ liệu nguồn
│
└── frontend/               # GIAO DIỆN WEB (ReactJS)
    ├── src/
    │   ├── AdminDashboard.tsx      # Trang Admin (Quản lý SV, Lớp, Môn)
    │   ├── TeacherDashboard.tsx    # Trang Giáo viên (Nhập điểm)
    │   ├── StudentDashboard.tsx    # Trang Sinh viên (Xem điểm, Chatbot)
    │   ├── Login.tsx               # Trang Đăng nhập
    │   └── App.tsx                 # Cấu hình đường dẫn (Routing)
    └── tailwind.config.js          # Cấu hình giao diện


🛠️ Hướng dẫn cài đặt & Chạy dự án

1. Yêu cầu hệ thống

Node.js (v18 trở lên).

MongoDB (đã cài đặt và đang chạy ở cổng 27017).

2. Cài đặt Backend

Mở terminal tại thư mục backend:

cd backend
npm install
npm install @google/generative-ai@latest  # Cài thư viện AI


(Lần đầu tiên) Chạy script nạp dữ liệu vào Database:

Đảm bảo file qlsv.sql đã có trong thư mục backend.

Chạy lệnh:

node migrate.js


Kiểm tra Terminal báo "Thành công" là OK.

Khởi chạy Server:

node index.js


Server sẽ chạy tại: http://localhost:5000

3. Cài đặt Frontend

Mở terminal mới tại thư mục frontend:

cd frontend
npm install


Khởi chạy giao diện Web:

npm run dev


Web sẽ chạy tại: http://localhost:5173

🔑 Tài khoản Demo (Đăng nhập)

Hệ thống hỗ trợ đăng nhập bằng Mã sinh viên (đối với SV) hoặc Email (đối với GV/Admin). Mật khẩu mặc định: 123456.

Vai trò

Tên đăng nhập (Username)

Mật khẩu

Chức năng chính

Admin

admin

123456

Quản lý SV, Lớp, Môn, Tài khoản.

Teacher

gv01 (hoặc tạo mới)

123456

Xem lớp dạy, Nhập/Sửa điểm.

Student

SV01

123456

Xem điểm cá nhân, Chat với AI.

Student

SV999 (User mới tạo)

123456

Test dữ liệu mới.

🤖 Tính năng AI Chatbot

Vị trí: Nằm trong trang Student Dashboard (Tab cuối cùng).

Cách dùng: Sinh viên đặt câu hỏi tự nhiên.

Ví dụ câu hỏi:

"Điểm môn Web của tớ bao nhiêu?"

"GPA của tớ là bao nhiêu?"

"Tớ có bị trượt môn nào không?"

Cơ chế: Hệ thống sử dụng Google Gemini AI để phân tích câu hỏi và trả lời dựa trên bảng điểm thực tế của sinh viên đó. Nếu mất kết nối, hệ thống tự động chuyển sang chế độ trả lời theo quy tắc (Rule-based) để đảm bảo luôn phản hồi.

📝 Ghi chú phát triển (Dev Notes)

API Key: Key của Google AI được cấu hình trực tiếp trong backend/index.js. Cần thay mới nếu hết hạn mức.

Database: Tên database mặc định là qlsv_nhom5.

Port:

Backend: 5000

Frontend: 5173

Dự án thực tập - Nhóm 5 - VTI Group
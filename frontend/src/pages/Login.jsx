import { useState } from 'react'

//navigate มีหน้าที่เปลี่ยนหน้าหลังจาก Login สำเร็จ
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();

  if (!email.endsWith('@gmail.com')) {
    alert('กรุณาใช้แค่ @gmail.com เท่านั้น');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password,}),
    });

    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem( 'user', JSON.stringify(data.user));

      navigate('/dashboard');

    } else {
      alert(data.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

  } catch (error) {
    console.error(error);
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  }
};

  return (
    /* กล่องนอกสุด: เต็มหน้าจอ, ไม่มี Padding, ลบสีพื้นหลังเทาออก */
    <div className="flex h-screen w-full font-sans">
        
      {/* --- ส่วนด้านซ้าย: รูปภาพพื้นหลังพร้อมโทนสีฟ้า (กินพื้นที่ 50% ของจอ) --- */}
      <div className="relative hidden w-1/2 md:block">
        <img 
          src="\login-bg.jpg" 
          alt="Interior design background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-600/60 mix-blend-multiply" />
      </div>

      {/* --- ส่วนด้านขวา: พื้นหลังน้ำเงินเต็มพื้นที่ฝั่งขวา (กินพื้นที่ 50% ของจอ) --- */}
      <div className="flex w-full flex-col items-center justify-center bg-blue-600 md:w-1/2 p-8">
        
        {/* การ์ดฟอร์มสีขาวข้างใน */}
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl md:p-12">
          
          {/* หัวข้อ */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-gray-950">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-base text-gray-600">กรุณาเข้าสู่ระบบเพื่อใช้งาน</p>
          </div>

          {/* ฟอร์ม Login */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* ช่องกรอกอีเมล */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">อีเมล</label>
              <input
                type="email"
                required
                pattern=".*@gmail\.com"
                title="กรุณาใช้อีเมลที่ลงท้ายด้วย @gmail.com เท่านั้น"
                className="block w-full rounded-xl border border-gray-300 bg-[#FCFBF4] px-4 py-3 text-gray-900 shadow-inner placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="กรอกอีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* ช่องกรอกรหัสผ่าน */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">รหัสผ่าน</label>
              <input
                type="password"
                required
                className="block w-full rounded-xl border border-gray-300 bg-[#FCFBF4] px-4 py-3 text-gray-900 shadow-inner placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* ปุ่มเข้าสู่ระบบ */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-500 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              >
                เข้าสู่ระบบ
              </button>
            </div>
            
          </form>

        </div> 
      </div> 

    </div>
  )
}

export default Login
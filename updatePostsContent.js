/**
 * Script cập nhật nội dung cho các bài post
 */

const { Post } = require('./models');
const sequelize = require('./config/database');

const postsContent = [
  {
    slug: 'tam-soat-ung-thu-mien-phi',
    title: 'Tầm soát ung thư miễn phí cho 100 bệnh nhân đầu tiên',
    excerpt: 'Bệnh viện tổ chức chương trình tầm soát ung thư miễn phí cho 100 bệnh nhân đầu tiên đăng ký nhân dịp kỷ niệm 20 năm thành lập.',
    content: `
<div class="post-content">
  <h2>🎉 Chương trình tầm soát ung thư MIỄN PHÍ</h2>
  <p class="lead">Nhân dịp kỷ niệm <strong>20 năm thành lập</strong>, Bệnh viện Đa khoa trân trọng tổ chức chương trình tầm soát ung thư miễn phí dành cho 100 bệnh nhân đầu tiên đăng ký.</p>
  
  <div class="alert alert-info">
    <strong>📅 Thời gian:</strong> 8h00 - 17h00, Thứ 7-8 (23-24/11/2025)<br>
    <strong>📍 Địa điểm:</strong> Hội trường tầng 1, Bệnh viện Đa khoa
  </div>

  <h3>📋 Nội dung chương trình khám sàng lọc</h3>
  <p>Chương trình bao gồm các dịch vụ y tế chất lượng cao hoàn toàn <strong>MIỄN PHÍ</strong>:</p>
  
  <ul>
    <li><strong>Khám lâm sàng tổng quát</strong> - Đánh giá tình trạng sức khỏe chung</li>
    <li><strong>Xét nghiệm máu toàn diện</strong> - Kiểm tra các chỉ số ung thư (CEA, AFP, CA125, PSA...)</li>
    <li><strong>Siêu âm ổ bụng</strong> - Phát hiện sớm các khối u bất thường</li>
    <li><strong>Chụp X-quang phổi</strong> - Tầm soát ung thư phổi</li>
    <li><strong>Khám phụ khoa</strong> (dành cho nữ) - Tầm soát ung thư cổ tử cung</li>
    <li><strong>Tư vấn dinh dưỡng</strong> - Hướng dẫn chế độ ăn phòng chống ung thư</li>
  </ul>

  <h3>👥 Đối tượng tham gia</h3>
  <ul>
    <li>Nam, nữ từ 40 tuổi trở lên</li>
    <li>Người có tiền sử gia đình mắc ung thư</li>
    <li>Người thường xuyên tiếp xúc với các yếu tố nguy cơ (hút thuốc, uống rượu bia, môi trường ô nhiễm)</li>
    <li>Người có các triệu chứng nghi ngờ (sụt cân không rõ nguyên nhân, mệt mỏi kéo dài, đau bất thường)</li>
  </ul>

  <h3>🏥 Đội ngũ y bác sĩ</h3>
  <p>Chương trình được thực hiện bởi đội ngũ chuyên gia đầu ngành:</p>
  <ul>
    <li><strong>PGS.TS. Nguyễn Văn An</strong> - Trưởng khoa Ung bướu</li>
    <li><strong>TS.BS. Trần Thị Bình</strong> - Phó khoa Chẩn đoán hình ảnh</li>
    <li><strong>ThS.BS. Lê Văn Cường</strong> - Chuyên gia xét nghiệm sinh hóa</li>
  </ul>

  <h3>📝 Cách đăng ký</h3>
  <ol>
    <li><strong>Đăng ký online:</strong> Gọi điện hoặc nhắn tin qua Zalo đến số <strong>1900-xxxx</strong></li>
    <li><strong>Đăng ký trực tiếp:</strong> Tại quầy lễ tân Bệnh viện (tầng 1)</li>
    <li><strong>Thời hạn đăng ký:</strong> Đến hết ngày 22/11/2025 hoặc khi đủ 100 bệnh nhân</li>
  </ol>

  <div class="alert alert-warning">
    <strong>⚠️ Lưu ý quan trọng:</strong>
    <ul class="mb-0">
      <li>Nhịn ăn ít nhất 8 tiếng trước khi khám (có thể uống nước lọc)</li>
      <li>Mang theo CMND/CCCD và bảo hiểm y tế (nếu có)</li>
      <li>Số lượng có hạn, đăng ký sớm để đảm bảo chỗ</li>
    </ul>
  </div>

  <h3>📞 Liên hệ</h3>
  <p>Mọi thắc mắc xin liên hệ:</p>
  <ul>
    <li><strong>Hotline:</strong> 1900-xxxx (24/7)</li>
    <li><strong>Email:</strong> tuvanykhoa@hospital.vn</li>
    <li><strong>Fanpage:</strong> facebook.com/benhviendakhoa</li>
  </ul>

  <p class="text-center mt-4">
    <em>"Phát hiện sớm - Điều trị kịp thời - Cứu sống cuộc đời"</em>
  </p>
</div>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    category: 'news'
  },
  {
    slug: '7-dau-hieu-canh-bao-benh-tim-mach',
    title: '7 dấu hiệu cảnh báo bệnh tim mạch bạn không nên bỏ qua',
    excerpt: 'Nhận biết sớm 7 dấu hiệu cảnh báo bệnh tim mạch để bảo vệ sức khỏe của bạn và gia đình.',
    content: `
<div class="post-content">
  <h2>❤️ Nhận biết sớm các dấu hiệu bệnh tim mạch</h2>
  <p class="lead">Bệnh tim mạch là <strong>nguyên nhân gây tử vong số 1</strong> trên toàn thế giới. Tại Việt Nam, mỗi năm có khoảng 200.000 người tử vong vì các bệnh liên quan đến tim mạch. Việc nhận biết sớm các dấu hiệu cảnh báo có thể cứu sống chính bạn và người thân.</p>

  <div class="alert alert-danger">
    <strong>⚠️ Cảnh báo:</strong> Nếu bạn gặp đau ngực dữ dội, khó thở nghiêm trọng hoặc ngất xỉu, hãy gọi cấp cứu 115 NGAY LẬP TỨC!
  </div>

  <h3>🔴 7 dấu hiệu cảnh báo không nên bỏ qua</h3>

  <h4>1. Đau ngực hoặc khó chịu vùng ngực</h4>
  <p>Đây là dấu hiệu <strong>phổ biến nhất</strong> của bệnh tim mạch:</p>
  <ul>
    <li>Cảm giác đau tức, nặng nề như có vật đè lên ngực</li>
    <li>Đau thường xuất hiện ở giữa ngực hoặc bên trái</li>
    <li>Cơn đau có thể kéo dài vài phút hoặc đến rồi đi</li>
    <li>Đau tăng lên khi gắng sức, giảm khi nghỉ ngơi</li>
  </ul>

  <h4>2. Khó thở bất thường</h4>
  <p>Khi tim không bơm máu hiệu quả, phổi không nhận đủ oxy:</p>
  <ul>
    <li>Thở dốc ngay cả khi làm việc nhẹ</li>
    <li>Khó thở khi nằm, phải ngồi dậy để thở</li>
    <li>Thức giấc giữa đêm vì khó thở</li>
  </ul>

  <h4>3. Mệt mỏi và kiệt sức không rõ nguyên nhân</h4>
  <p>Đặc biệt ở phụ nữ, đây là dấu hiệu thường bị bỏ qua:</p>
  <ul>
    <li>Mệt mỏi bất thường kéo dài nhiều ngày</li>
    <li>Cảm giác kiệt sức ngay cả khi không làm gì nặng</li>
    <li>Không thể hoàn thành các công việc hàng ngày</li>
  </ul>

  <h4>4. Chóng mặt, hoa mắt</h4>
  <ul>
    <li>Đầu quay, mất thăng bằng thường xuyên</li>
    <li>Cảm giác sắp ngất xỉu</li>
    <li>Có thể kèm theo buồn nôn</li>
  </ul>

  <h4>5. Đau lan ra cánh tay, vai, cổ, hàm</h4>
  <p>Cơn đau tim thường không chỉ giới hạn ở ngực:</p>
  <ul>
    <li><strong>Cánh tay trái:</strong> Dấu hiệu kinh điển nhất</li>
    <li><strong>Vai và lưng:</strong> Đặc biệt ở phụ nữ</li>
    <li><strong>Cổ và hàm:</strong> Đau âm ỉ, khó chịu</li>
  </ul>

  <h4>6. Nhịp tim không đều (loạn nhịp)</h4>
  <ul>
    <li>Tim đập nhanh bất thường (hồi hộp, đánh trống ngực)</li>
    <li>Tim đập chậm bất thường</li>
    <li>Cảm giác tim "bỏ nhịp" hoặc "đập thêm nhịp"</li>
  </ul>

  <h4>7. Sưng phù chân và mắt cá</h4>
  <ul>
    <li>Chân bàn chân sưng phù, đặc biệt vào buổi chiều/tối</li>
    <li>Ấn vào da để lại vết lõm</li>
    <li>Dấu hiệu của suy tim sung huyết</li>
  </ul>

  <h3>👩‍⚕️ Khi nào cần đi khám ngay?</h3>
  <div class="alert alert-info">
    <p>Bạn nên đi khám tim mạch NGAY nếu:</p>
    <ul class="mb-0">
      <li>Có <strong>2 hoặc nhiều</strong> triệu chứng trên</li>
      <li>Triệu chứng xuất hiện thường xuyên hoặc kéo dài</li>
      <li>Có tiền sử gia đình mắc bệnh tim mạch</li>
      <li>Có các yếu tố nguy cơ: béo phì, tiểu đường, tăng huyết áp, hút thuốc</li>
    </ul>
  </div>

  <h3>🛡️ Cách phòng ngừa bệnh tim mạch</h3>
  <ol>
    <li><strong>Ăn uống lành mạnh:</strong> Giảm muối, chất béo bão hòa, tăng rau xanh trái cây</li>
    <li><strong>Tập thể dục đều đặn:</strong> Ít nhất 30 phút/ngày, 5 ngày/tuần</li>
    <li><strong>Không hút thuốc:</strong> Ngưng hút thuốc giảm 50% nguy cơ đột quỵ</li>
    <li><strong>Kiểm soát cân nặng:</strong> Duy trì BMI từ 18.5-24.9</li>
    <li><strong>Kiểm tra sức khỏe định kỳ:</strong> Đo huyết áp, cholesterol, đường huyết</li>
  </ol>

  <h3>📞 Đặt lịch khám tim mạch</h3>
  <p>Bệnh viện chúng tôi có đội ngũ chuyên gia tim mạch hàng đầu và trang thiết bị hiện đại:</p>
  <ul>
    <li>Điện tâm đồ (ECG)</li>
    <li>Siêu âm tim 4D</li>
    <li>Chụp CT mạch vành</li>
    <li>Thông tim can thiệp</li>
  </ul>
  <p><strong>Hotline đặt lịch:</strong> 1900-xxxx</p>

  <p class="text-center mt-4 text-muted">
    <em>"Lắng nghe cơ thể - Hành động kịp thời - Bảo vệ trái tim"</em>
  </p>
</div>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1628348070889-cb656235b4eb?w=800',
    category: 'health_tips'
  },
  {
    slug: '10-thoi-quen-tot-giup-cai-thien-suc-khoe-tim-mach',
    title: '10 Thói Quen Tốt Giúp Cải Thiện Sức Khỏe Tim Mạch',
    excerpt: 'Tìm hiểu về những thói quen đơn giản nhưng hiệu quả giúp bạn có một trái tim khỏe mạnh và phòng ngừa các bệnh tim mạch.',
    content: `
<div class="post-content">
  <h2>💪 10 Thói quen vàng cho trái tim khỏe mạnh</h2>
  <p class="lead">Sức khỏe tim mạch không chỉ phụ thuộc vào thuốc men hay điều trị y tế, mà còn đến từ những thói quen hàng ngày. Dưới đây là <strong>10 thói quen đơn giản</strong> nhưng cực kỳ hiệu quả giúp bạn có một trái tim khỏe mạnh.</p>

  <h3>1. 🏃 Tập thể dục đều đặn mỗi ngày</h3>
  <p>Vận động là "liều thuốc" tốt nhất cho tim:</p>
  <ul>
    <li><strong>Thời lượng:</strong> 30-45 phút mỗi ngày, 5 ngày/tuần</li>
    <li><strong>Cường độ:</strong> Vừa phải (đi bộ nhanh, đạp xe, bơi lội)</li>
    <li><strong>Lợi ích:</strong> Giảm huyết áp, cải thiện cholesterol, tăng cường tuần hoàn</li>
  </ul>
  <div class="alert alert-success">
    <strong>💡 Mẹo:</strong> Bắt đầu với 10 phút đi bộ mỗi ngày và tăng dần. Đi cầu thang bộ thay vì thang máy!
  </div>

  <h3>2. 🥗 Ăn uống theo chế độ Địa Trung Hải</h3>
  <p>Chế độ ăn này được chứng minh là <strong>tốt nhất cho tim mạch</strong>:</p>
  <ul>
    <li><strong>Nên ăn:</strong> Rau xanh, trái cây, cá, dầu olive, các loại hạt, ngũ cốc nguyên hạt</li>
    <li><strong>Hạn chế:</strong> Thịt đỏ, thực phẩm chế biến sẵn, đồ ngọt</li>
    <li><strong>Tránh:</strong> Trans fat, thức ăn nhanh, nước ngọt có gas</li>
  </ul>

  <h3>3. 🧂 Giảm muối trong khẩu phần ăn</h3>
  <p>Muối là "kẻ thù thầm lặng" của tim:</p>
  <ul>
    <li><strong>Khuyến nghị:</strong> Dưới 5g muối/ngày (khoảng 1 thìa cà phê)</li>
    <li><strong>Cách thực hiện:</strong>
      <ul>
        <li>Không thêm muối khi nấu ăn</li>
        <li>Đọc nhãn thực phẩm đóng gói</li>
        <li>Dùng gia vị thảo mộc thay muối</li>
      </ul>
    </li>
  </ul>

  <h3>4. 😴 Ngủ đủ 7-8 tiếng mỗi đêm</h3>
  <p>Giấc ngủ chất lượng giúp tim phục hồi:</p>
  <ul>
    <li>Thiếu ngủ làm tăng hormone stress cortisol</li>
    <li>Ngủ quá ít hoặc quá nhiều đều tăng nguy cơ bệnh tim</li>
    <li><strong>Mẹo:</strong> Đi ngủ và thức dậy cùng giờ mỗi ngày</li>
  </ul>

  <h3>5. 🚭 Bỏ thuốc lá hoàn toàn</h3>
  <p>Hút thuốc là yếu tố nguy cơ <strong>lớn nhất</strong> có thể phòng tránh:</p>
  <ul>
    <li>Hút thuốc làm tăng nguy cơ đau tim lên 2-4 lần</li>
    <li>Sau 1 năm bỏ thuốc, nguy cơ bệnh tim giảm 50%</li>
    <li>Sau 15 năm, nguy cơ gần như bằng người không hút</li>
  </ul>

  <h3>6. 🍷 Hạn chế rượu bia</h3>
  <ul>
    <li><strong>Nam:</strong> Không quá 2 đơn vị cồn/ngày</li>
    <li><strong>Nữ:</strong> Không quá 1 đơn vị cồn/ngày</li>
    <li>1 đơn vị = 1 lon bia (330ml) = 1 ly rượu vang (150ml)</li>
  </ul>

  <h3>7. 😌 Kiểm soát stress hiệu quả</h3>
  <p>Stress mãn tính làm tăng huyết áp và nhịp tim:</p>
  <ul>
    <li><strong>Thiền định:</strong> 10-15 phút mỗi ngày</li>
    <li><strong>Yoga:</strong> Kết hợp vận động và thư giãn</li>
    <li><strong>Hít thở sâu:</strong> 4 giây hít vào - 4 giây nín thở - 4 giây thở ra</li>
    <li><strong>Hoạt động yêu thích:</strong> Đọc sách, nghe nhạc, làm vườn...</li>
  </ul>

  <h3>8. ⚖️ Duy trì cân nặng hợp lý</h3>
  <p>Béo phì tăng gánh nặng cho tim:</p>
  <ul>
    <li><strong>BMI lý tưởng:</strong> 18.5 - 24.9</li>
    <li><strong>Vòng eo:</strong> Nam &lt; 90cm, Nữ &lt; 80cm</li>
    <li>Giảm 5-10% cân nặng đã cải thiện đáng kể sức khỏe tim mạch</li>
  </ul>

  <h3>9. 💊 Kiểm soát các bệnh nền</h3>
  <p>Quản lý tốt các yếu tố nguy cơ:</p>
  <ul>
    <li><strong>Huyết áp:</strong> Dưới 120/80 mmHg</li>
    <li><strong>Cholesterol LDL:</strong> Dưới 100 mg/dL</li>
    <li><strong>Đường huyết:</strong> HbA1c dưới 7% (người tiểu đường)</li>
    <li>Uống thuốc đều đặn theo chỉ định bác sĩ</li>
  </ul>

  <h3>10. 🏥 Khám sức khỏe định kỳ</h3>
  <p>Phát hiện sớm = Điều trị hiệu quả:</p>
  <ul>
    <li><strong>Người dưới 40 tuổi:</strong> Khám 2 năm/lần</li>
    <li><strong>Người trên 40 tuổi:</strong> Khám 1 năm/lần</li>
    <li><strong>Người có yếu tố nguy cơ:</strong> Khám 6 tháng/lần</li>
  </ul>

  <div class="alert alert-info mt-4">
    <h5>📊 Các chỉ số cần theo dõi:</h5>
    <table class="table table-bordered mb-0">
      <tr>
        <th>Chỉ số</th>
        <th>Mức bình thường</th>
      </tr>
      <tr>
        <td>Huyết áp</td>
        <td>&lt; 120/80 mmHg</td>
      </tr>
      <tr>
        <td>Cholesterol toàn phần</td>
        <td>&lt; 200 mg/dL</td>
      </tr>
      <tr>
        <td>LDL (xấu)</td>
        <td>&lt; 100 mg/dL</td>
      </tr>
      <tr>
        <td>HDL (tốt)</td>
        <td>&gt; 40 mg/dL (nam), &gt; 50 mg/dL (nữ)</td>
      </tr>
      <tr>
        <td>Đường huyết lúc đói</td>
        <td>&lt; 100 mg/dL</td>
      </tr>
    </table>
  </div>

  <h3>🎯 Bắt đầu từ hôm nay!</h3>
  <p>Không cần thay đổi tất cả cùng một lúc. Hãy chọn <strong>2-3 thói quen</strong> và bắt đầu thực hiện. Sau 21 ngày, chúng sẽ trở thành thói quen tự nhiên. Rồi tiếp tục với các thói quen khác.</p>

  <p class="text-center mt-4">
    <strong>"Mỗi bước chân nhỏ đều là một bước tiến lớn cho trái tim khỏe mạnh!"</strong>
  </p>
</div>
    `,
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    category: 'health_tips'
  }
];

async function updatePostsContent() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    for (const postData of postsContent) {
      const post = await Post.findOne({ where: { slug: postData.slug } });
      
      if (post) {
        await post.update({
          content: postData.content,
          excerpt: postData.excerpt,
          thumbnail: postData.thumbnail
        });
        console.log(`✅ Đã cập nhật: ${postData.title}`);
      } else {
        // Nếu chưa có, tạo mới
        await Post.create({
          ...postData,
          author_id: 1, // Admin
          status: 'published',
          views: Math.floor(Math.random() * 3000) + 500
        });
        console.log(`✅ Đã tạo mới: ${postData.title}`);
      }
    }

    console.log('\n🎉 Hoàn thành cập nhật nội dung bài viết!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

updatePostsContent();

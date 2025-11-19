const { Post, User } = require('../models');

const samplePosts = [
  {
    title: 'Tầm soát ung thư miễn phí cho 100 bệnh nhân đầu tiên',
    slug: 'tam-soat-ung-thu-mien-phi',
    excerpt: 'Bệnh viện tổ chức chương trình tầm soát ung thư miễn phí cho 100 bệnh nhân đầu tiên đăng ký nhân dịp kỷ niệm 20 năm thành lập.',
    content: `
      <h2>Chương trình tầm soát ung thư miễn phí</h2>
      <p>Nhân dịp kỷ niệm 20 năm thành lập, Bệnh viện Đa khoa tổ chức chương trình <strong>tầm soát ung thư miễn phí</strong> cho 100 bệnh nhân đầu tiên đăng ký.</p>
      
      <h3>Nội dung chương trình</h3>
      <ul>
        <li>Khám lâm sàng miễn phí</li>
        <li>Xét nghiệm máu miễn phí</li>
        <li>Siêu âm tổng quát miễn phí</li>
        <li>Tư vấn dinh dưỡng và lối sống lành mạnh</li>
      </ul>

      <h3>Thời gian và địa điểm</h3>
      <p><strong>Thời gian:</strong> 8h00 - 17h00, Thứ 7-8 (23-24/11/2025)</p>
      <p><strong>Địa điểm:</strong> Hội trường tầng 1, Bệnh viện Đa khoa</p>
      
      <p><em>Liên hệ hotline <strong>1900-xxxx</strong> để đăng ký tham gia!</em></p>
    `,
    category: 'news',
    thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    status: 'published',
    views: 1250
  },
  {
    title: '7 dấu hiệu cảnh báo bệnh tim mạch bạn không nên bỏ qua',
    slug: '7-dau-hieu-canh-bao-benh-tim-mach',
    excerpt: 'Nhận biết sớm 7 dấu hiệu cảnh báo bệnh tim mạch để bảo vệ sức khỏe của bạn và gia đình.',
    content: `
      <h2>Nhận biết sớm các dấu hiệu bệnh tim mạch</h2>
      <p>Bệnh tim mạch là một trong những nguyên nhân gây tử vong hàng đầu. Việc nhận biết sớm các dấu hiệu cảnh báo có thể cứu sống bạn.</p>
      
      <h3>7 dấu hiệu cần lưu ý</h3>
      <ol>
        <li><strong>Đau ngực:</strong> Cảm giác đau tức, nặng ngực, đặc biệt khi gắng sức</li>
        <li><strong>Khó thở:</strong> Thở dốc, khó thở ngay cả khi nghỉ ngơi</li>
        <li><strong>Mệt mỏi bất thường:</strong> Cảm thấy kiệt sức không rõ nguyên nhân</li>
        <li><strong>Chóng mặt:</strong> Đầu quay, mất thăng bằng thường xuyên</li>
        <li><strong>Đau lan ra:</strong> Đau lan ra cánh tay trái, vai, cổ</li>
        <li><strong>Tim đập nhanh:</strong> Nhịp tim không đều, hồi hộp</li>
        <li><strong>Phù chân:</strong> Chân bàn chân sưng phù, đặc biệt vào buổi tối</li>
      </ol>

      <h3>Khi nào cần đi khám ngay?</h3>
      <p>Nếu bạn có 2 hoặc nhiều triệu chứng trên, hãy đến bệnh viện để được khám và tư vấn ngay. Đừng chủ quan với sức khỏe của mình!</p>
    `,
    category: 'health_tips',
    thumbnail: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
    status: 'published',
    views: 3420
  },
  {
    title: '10 Thói Quen Tốt Giúp Cải Thiện Sức Khỏe Tim Mạch',
    slug: '10-thoi-quen-tot-giup-cai-thien-suc-khoe-tim-mach',
    excerpt: 'Tìm hiểu về những thói quen đơn giản nhưng hiệu quả giúp bạn có một trái tim khỏe mạnh và phòng ngừa các bệnh tim mạch.',
    content: `
      <h2>Giới thiệu</h2>
      <p>Tim mạch là một trong những cơ quan quan trọng nhất của cơ thể. Việc duy trì sức khỏe tim mạch tốt không chỉ giúp bạn sống lâu hơn mà còn nâng cao chất lượng cuộc sống.</p>
      
      <h3>1. Tập thể dục đều đặn</h3>
      <p>Tập thể dục ít nhất 30 phút mỗi ngày giúp cải thiện tuần hoàn máu và tăng cường sức khỏe tim mạch. Các bài tập aerobic như đi bộ, chạy bộ, bơi lội rất tốt cho tim.</p>
      
      <h3>2. Ăn uống lành mạnh</h3>
      <p>Chế độ ăn giàu rau xanh, trái cây, ngũ cốc nguyên hạt và cá giúp giảm cholesterol và huyết áp.</p>
      
      <h3>3. Kiểm soát stress</h3>
      <p>Stress kéo dài có thể gây hại cho tim. Hãy tìm cách thư giãn như thiền, yoga, hoặc các hoạt động yêu thích.</p>
      
      <h3>4. Ngủ đủ giấc</h3>
      <p>Ngủ 7-8 tiếng mỗi đêm giúp cơ thể phục hồi và giảm nguy cơ bệnh tim mạch.</p>
      
      <h3>5. Bỏ thuốc lá</h3>
      <p>Hút thuốc là một trong những yếu tố nguy cơ lớn nhất gây bệnh tim mạch.</p>
    `,
    category: 'health_tips',
    thumbnail: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800',
    status: 'published',
    views: 1250
  },
  {
    title: 'Vaccine COVID-19: Những Điều Cần Biết Về Mũi Tiêm Tăng Cường',
    slug: 'vaccine-covid-19-nhung-dieu-can-biet-ve-mui-tiem-tang-cuong',
    excerpt: 'Thông tin cập nhật về vaccine COVID-19 và tầm quan trọng của việc tiêm mũi tăng cường để bảo vệ sức khỏe cộng đồng.',
    content: `
      <h2>Tại sao cần tiêm mũi tăng cường?</h2>
      <p>Hiệu quả của vaccine COVID-19 có thể giảm dần theo thời gian. Mũi tiêm tăng cường giúp kích hoạt lại hệ miễn dịch và tăng cường khả năng bảo vệ.</p>
      
      <h3>Ai nên tiêm mũi tăng cường?</h3>
      <ul>
        <li>Người trên 18 tuổi đã tiêm đủ liều vaccine cơ bản</li>
        <li>Người có bệnh lý nền</li>
        <li>Người cao tuổi trên 65 tuổi</li>
        <li>Nhân viên y tế</li>
      </ul>
      
      <h3>Tác dụng phụ có thể gặp</h3>
      <p>Các tác dụng phụ thường nhẹ và tự khỏi sau vài ngày như đau tại chỗ tiêm, mệt mỏi, sốt nhẹ.</p>
    `,
    category: 'news',
    thumbnail: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800',
    status: 'published',
    views: 2340
  },
  {
    title: 'Tiểu Đường Type 2: Nguyên Nhân, Triệu Chứng và Cách Phòng Ngừa',
    slug: 'tieu-duong-type-2-nguyen-nhan-trieu-chung-va-cach-phong-ngua',
    excerpt: 'Hiểu rõ về bệnh tiểu đường type 2, một trong những bệnh mạn tính phổ biến nhất hiện nay và cách phòng ngừa hiệu quả.',
    content: `
      <h2>Tiểu đường Type 2 là gì?</h2>
      <p>Tiểu đường type 2 là tình trạng cơ thể không sử dụng insulin hiệu quả, dẫn đến lượng đường trong máu cao.</p>
      
      <h3>Nguyên nhân chính</h3>
      <ul>
        <li>Béo phì và thừa cân</li>
        <li>Ít vận động</li>
        <li>Chế độ ăn không lành mạnh</li>
        <li>Yếu tố di truyền</li>
        <li>Tuổi tác</li>
      </ul>
      
      <h3>Triệu chứng thường gặp</h3>
      <ul>
        <li>Khát nước nhiều</li>
        <li>Đi tiểu thường xuyên</li>
        <li>Mệt mỏi</li>
        <li>Giảm cân không rõ nguyên nhân</li>
        <li>Vết thương lâu lành</li>
      </ul>
      
      <h3>Cách phòng ngừa</h3>
      <p>Duy trì cân nặng hợp lý, tập thể dục đều đặn, ăn uống lành mạnh và kiểm tra sức khỏe định kỳ.</p>
    `,
    category: 'disease_info',
    thumbnail: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800',
    status: 'published',
    views: 1890
  },
  {
    title: 'Bác Sĩ Tư Vấn: Chăm Sóc Sức Khỏe Tâm Thần Trong Thời Đại Số',
    slug: 'bac-si-tu-van-cham-soc-suc-khoe-tam-than-trong-thoi-dai-so',
    excerpt: 'Các chuyên gia tâm lý chia sẻ về tầm quan trọng của sức khỏe tâm thần và cách chăm sóc bản thân trong cuộc sống hiện đại.',
    content: `
      <h2>Sức khỏe tâm thần trong thời đại số</h2>
      <p>Cuộc sống hiện đại với công nghệ và mạng xã hội đang ảnh hưởng không nhỏ đến sức khỏe tâm thần của chúng ta.</p>
      
      <h3>Những dấu hiệu cần chú ý</h3>
      <ul>
        <li>Lo âu, căng thẳng kéo dài</li>
        <li>Mất ngủ hoặc ngủ quá nhiều</li>
        <li>Mất hứng thú với các hoạt động yêu thích</li>
        <li>Cảm giác cô đơn</li>
        <li>Khó tập trung</li>
      </ul>
      
      <h3>Lời khuyên từ bác sĩ</h3>
      <p>Hãy dành thời gian cho bản thân, giới hạn thời gian sử dụng điện thoại, kết nối với người thân, và đừng ngại tìm kiếm sự giúp đỡ chuyên nghiệp khi cần.</p>
    `,
    category: 'doctor_advice',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
    status: 'published',
    views: 1560
  },
  {
    title: 'Lối Sống Lành Mạnh: Cân Bằng Giữa Công Việc và Cuộc Sống',
    slug: 'loi-song-lanh-manh-can-bang-giua-cong-viec-va-cuoc-song',
    excerpt: 'Khám phá cách tạo sự cân bằng giữa công việc và cuộc sống cá nhân để có một lối sống khỏe mạnh và hạnh phúc.',
    content: `
      <h2>Tầm quan trọng của Work-Life Balance</h2>
      <p>Cân bằng giữa công việc và cuộc sống giúp giảm stress, tăng năng suất và cải thiện chất lượng cuộc sống tổng thể.</p>
      
      <h3>Các bước để đạt được sự cân bằng</h3>
      <ol>
        <li><strong>Đặt ranh giới rõ ràng:</strong> Tách biệt thời gian làm việc và thời gian riêng tư</li>
        <li><strong>Ưu tiên sức khỏe:</strong> Dành thời gian tập thể dục và nghỉ ngơi</li>
        <li><strong>Học cách nói không:</strong> Đừng nhận quá nhiều công việc</li>
        <li><strong>Dành thời gian cho gia đình:</strong> Tạo kỷ niệm đẹp với người thân</li>
        <li><strong>Theo đuổi sở thích:</strong> Làm những điều bạn yêu thích</li>
      </ol>
      
      <h3>Lợi ích của lối sống cân bằng</h3>
      <ul>
        <li>Giảm căng thẳng và lo âu</li>
        <li>Tăng năng suất làm việc</li>
        <li>Cải thiện mối quan hệ</li>
        <li>Sức khỏe thể chất tốt hơn</li>
      </ul>
    `,
    category: 'lifestyle',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    status: 'published',
    views: 980
  },
  {
    title: 'Chế Độ Ăn Kiêng Địa Trung Hải: Lợi Ích Cho Sức Khỏe Tổng Thể',
    slug: 'che-do-an-kieng-dia-trung-hai-loi-ich-cho-suc-khoe-tong-the',
    excerpt: 'Tìm hiểu về chế độ ăn kiêng Địa Trung Hải được các chuyên gia dinh dưỡng khuyến nghị và lợi ích của nó đối với sức khỏe.',
    content: `
      <h2>Chế độ ăn Địa Trung Hải là gì?</h2>
      <p>Đây là lối ăn uống truyền thống của các quốc gia vùng Địa Trung Hải, được UNESCO công nhận là Di sản Văn hóa Phi vật thể.</p>
      
      <h3>Những thực phẩm chính</h3>
      <ul>
        <li>Dầu olive nguyên chất</li>
        <li>Rau xanh và trái cây tươi</li>
        <li>Ngũ cốc nguyên hạt</li>
        <li>Các loại đậu và hạt</li>
        <li>Cá và hải sản</li>
        <li>Sữa chua và phô mai</li>
        <li>Gia vị thảo mộc</li>
      </ul>
      
      <h3>Lợi ích sức khỏe</h3>
      <ul>
        <li>Giảm nguy cơ bệnh tim mạch</li>
        <li>Kiểm soát cân nặng</li>
        <li>Cải thiện chức năng não bộ</li>
        <li>Giảm viêm nhiễm</li>
        <li>Phòng ngừa tiểu đường type 2</li>
      </ul>
    `,
    category: 'health_tips',
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
    status: 'published',
    views: 1420
  },
  {
    title: 'Bệnh Viêm Gan B: Cập Nhật Phương Pháp Điều Trị Mới Nhất',
    slug: 'benh-viem-gan-b-cap-nhat-phuong-phap-dieu-tri-moi-nhat',
    excerpt: 'Những tiến bộ mới trong điều trị viêm gan B và tầm quan trọng của việc phát hiện sớm bệnh.',
    content: `
      <h2>Viêm gan B tại Việt Nam</h2>
      <p>Viêm gan B là một vấn đề sức khỏe cộng đồng nghiêm trọng tại Việt Nam với khoảng 8-10% dân số bị nhiễm virus viêm gan B.</p>
      
      <h3>Đường lây truyền</h3>
      <ul>
        <li>Từ mẹ sang con trong quá trình sinh</li>
        <li>Qua đường máu</li>
        <li>Quan hệ tình dục không an toàn</li>
        <li>Dùng chung kim tiêm</li>
      </ul>
      
      <h3>Phương pháp điều trị hiện đại</h3>
      <p>Các thuốc kháng virus thế hệ mới như Tenofovir và Entecavir đã cho thấy hiệu quả cao trong việc kiểm soát virus và ngăn ngừa biến chứng.</p>
      
      <h3>Phòng ngừa</h3>
      <ul>
        <li>Tiêm vaccine viêm gan B đầy đủ</li>
        <li>Không dùng chung vật dụng cá nhân</li>
        <li>Quan hệ tình dục an toàn</li>
        <li>Kiểm tra sức khỏe định kỳ</li>
      </ul>
    `,
    category: 'disease_info',
    thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
    status: 'published',
    views: 2100
  },
  {
    title: 'Yoga Cho Người Mới Bắt Đầu: Hướng Dẫn Từng Bước',
    slug: 'yoga-cho-nguoi-moi-bat-dau-huong-dan-tung-buoc',
    excerpt: 'Khởi đầu hành trình yoga với những tư thế cơ bản dành cho người mới, giúp cải thiện sức khỏe và tinh thần.',
    content: `
      <h2>Yoga - Môn thể dục cho cả thể chất và tinh thần</h2>
      <p>Yoga không chỉ giúp cơ thể dẻo dai, khỏe mạnh mà còn mang lại sự bình an cho tâm hồn.</p>
      
      <h3>Lợi ích của Yoga</h3>
      <ul>
        <li>Tăng cường sức mạnh và độ dẻo dai</li>
        <li>Cải thiện tư thế và thăng bằng</li>
        <li>Giảm stress và lo âu</li>
        <li>Cải thiện giấc ngủ</li>
        <li>Tăng cường sự tập trung</li>
      </ul>
      
      <h3>Các tư thế cơ bản cho người mới</h3>
      <ol>
        <li><strong>Tư thế núi (Mountain Pose):</strong> Tư thế đứng cơ bản</li>
        <li><strong>Tư thế con mèo-bò (Cat-Cow):</strong> Giúp giãn cột sống</li>
        <li><strong>Tư thế con chó úp mặt (Downward Dog):</strong> Giãn toàn thân</li>
        <li><strong>Tư thế em bé (Child's Pose):</strong> Tư thế nghỉ và thư giãn</li>
      </ol>
      
      <h3>Lời khuyên khi tập</h3>
      <p>Hãy bắt đầu từ từ, lắng nghe cơ thể mình, và không nên ép mình quá sức. Tập đều đặn mỗi ngày dù chỉ 15-20 phút.</p>
    `,
    category: 'lifestyle',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
    status: 'published',
    views: 1750
  }
];

async function seedPosts() {
  try {
    console.log('Starting to seed posts...');
    
    // Get admin user as author
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminUser) {
      console.error('Admin user not found. Please create an admin user first.');
      return;
    }
    
    // Clear existing posts
    await Post.destroy({ where: {} });
    console.log('Cleared existing posts');
    
    // Create posts
    for (const postData of samplePosts) {
      await Post.create({
        ...postData,
        author_id: adminUser.id,
        published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
    }
    
    console.log(`✅ Successfully seeded ${samplePosts.length} posts`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding posts:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedPosts();
}

module.exports = seedPosts;

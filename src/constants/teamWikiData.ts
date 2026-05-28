import groupSquadsParsed from "./groupSquadsParsed.json";

export interface Player {
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  club: string;
}

interface ParsedPlayer {
  name: string;
  club: string;
}

interface ParsedSquad {
  Goalkeepers?: ParsedPlayer[];
  Defenders?: ParsedPlayer[];
  Midfielders?: ParsedPlayer[];
  Forwards?: ParsedPlayer[];
}

interface ParsedTeam {
  status: string;
  squad: ParsedSquad;
}

interface ParsedGroup {
  [teamName: string]: ParsedTeam;
}

interface ParsedGroups {
  [groupName: string]: ParsedGroup;
}

const groupSquads = groupSquadsParsed as unknown as ParsedGroups;

export interface Achievement {
  year: string;
  host: string;
  result: string;
}

export interface TeamWiki {
  coach: string;
  fifaRanking: number;
  federation: string;
  bestResult: string;
  description: string;
  achievements: Achievement[];
}

export const TEAM_WIKI_MAP: Record<string, TeamWiki> = {
  MX: {
    coach: "Javier Aguirre",
    fifaRanking: 15,
    federation: "Liên đoàn bóng đá Mexico (FMF)",
    bestResult: "Tứ kết (1970, 1986)",
    description: "Mexico là một trong những thế lực bóng đá hàng đầu của khu vực CONCACAF với lối chơi kỹ thuật, giàu thể lực và luôn là khách quen tại các vòng chung kết World Cup. Với tư cách đồng chủ nhà World Cup 2026, 'El Tri' kỳ vọng sẽ vượt qua cái dớp vòng 1/8 để tiến sâu vào giải đấu lịch sử này.",
    achievements: [
      { year: "1970", host: "Mexico", result: "Tứ kết" },
      { year: "1986", host: "Mexico", result: "Tứ kết" },
      { year: "1994 - 2018", host: "Nhiều nơi", result: "Vòng 1/8 (7 lần liên tiếp)" },
      { year: "2022", host: "Qatar", result: "Vòng bảng" }
    ]
  },
  ZA: {
    coach: "Hugo Broos",
    fifaRanking: 59,
    federation: "Hiệp hội bóng đá Nam Phi (SAFA)",
    bestResult: "Vòng bảng (1998, 2002, 2010)",
    description: "Biệt danh 'Bafana Bafana', Nam Phi là đội tuyển có lối chơi cống hiến đầy ngẫu hứng đặc trưng của bóng đá lục địa đen. Dưới sự dẫn dắt của chiến lược gia lão luyện Hugo Broos, đội bóng đang hồi sinh mạnh mẽ và đặt mục tiêu làm nên bất ngờ tại ngày hội bóng đá lớn nhất hành tinh năm 2026.",
    achievements: [
      { year: "1998", host: "Pháp", result: "Vòng bảng" },
      { year: "2002", host: "Hàn Quốc & Nhật Bản", result: "Vòng bảng" },
      { year: "2010", host: "Nam Phi", result: "Vòng bảng (Chủ nhà)" }
    ]
  },
  KR: {
    coach: "Hong Myung-bo",
    fifaRanking: 22,
    federation: "Hiệp hội bóng đá Hàn Quốc (KFA)",
    bestResult: "Hạng tư (2002)",
    description: "Hàn Quốc là quốc gia châu Á giàu truyền thống nhất tại đấu trường World Cup với kỷ lục nhiều lần tham dự nhất khu vực. Sở hữu dàn ngôi sao đẳng cấp thế giới cùng tinh thần chiến đấu quả cảm 'mãnh hổ', họ luôn là đối thủ khó chịu đối với mọi ông lớn bóng đá.",
    achievements: [
      { year: "2002", host: "Hàn Quốc & Nhật Bản", result: "Hạng tư (Kỷ lục châu Á)" },
      { year: "2010", host: "Nam Phi", result: "Vòng 1/8" },
      { year: "2022", host: "Qatar", result: "Vòng 1/8" }
    ]
  },
  CZ: {
    coach: "Ivan Hašek",
    fifaRanking: 36,
    federation: "Hiệp hội bóng đá Cộng hòa Séc (FAČR)",
    bestResult: "Á quân (1934, 1962 - dưới tên Tiệp Khắc)",
    description: "Cộng hòa Séc thừa hưởng di sản bóng đá đồ sộ từ Tiệp Khắc cũ với lối chơi kỷ luật, khoa học nhưng không thiếu chất nghệ sĩ. Đội hình hiện tại là sự kết hợp giữa các chiến binh dày dặn kinh nghiệm chinh chiến tại châu Âu cùng sức trẻ đầy khát vọng.",
    achievements: [
      { year: "1934", host: "Ý", result: "Á quân (Tiệp Khắc)" },
      { year: "1962", host: "Chile", result: "Á quân (Tiệp Khắc)" },
      { year: "1990", host: "Ý", result: "Tứ kết (Tiệp Khắc)" },
      { year: "2006", host: "Đức", result: "Vòng bảng" }
    ]
  },
  CA: {
    coach: "Jesse Marsch",
    fifaRanking: 49,
    federation: "Hiệp hội bóng đá Canada (Canada Soccer)",
    bestResult: "Vòng bảng (1986, 2022)",
    description: "Canada đang trải qua thế hệ vàng lịch sử của nền bóng đá quốc gia này. Dưới sự dẫn dắt của chiến lược gia Jesse Marsch, Canada sở hữu lối chơi phòng ngự phản công với tốc độ xé gió từ hai hành lang biên. Là đồng chủ nhà của World Cup 2026, họ đặt kỳ vọng lịch sử có lần đầu tiên vượt qua vòng đấu bảng.",
    achievements: [
      { year: "1986", host: "Mexico", result: "Vòng bảng" },
      { year: "2022", host: "Qatar", result: "Vòng bảng" }
    ]
  },
  BA: {
    coach: "Sergej Barbarez",
    fifaRanking: 74,
    federation: "Hiệp hội bóng đá Bosnia và Herzegovina (NFSBiH)",
    bestResult: "Vòng bảng (2014)",
    description: "Trở lại sân chơi lớn nhất hành tinh sau 12 năm kể từ chiến tích năm 2014 tại Brazil, 'Rồng Xanh' Bosnia sở hữu lối chơi cơ bắp đậm chất Đông Âu nhưng vô cùng tinh tế ở các pha dứt điểm cận thành. Họ luôn sẵn sàng đóng vai trò 'kẻ ngáng đường vĩ đại' tại giải đấu năm nay.",
    achievements: [
      { year: "2014", host: "Brazil", result: "Vòng bảng" }
    ]
  },
  QA: {
    coach: "Tintín Márquez",
    fifaRanking: 34,
    federation: "Hiệp hội bóng đá Qatar (QFA)",
    bestResult: "Vòng bảng (2022)",
    description: "Đội đương kim vô địch Asian Cup hai lần liên tiếp (2019, 2023) đang cho thấy bước tiến vượt bậc của bóng đá Vùng Vịnh. Khác với sự bỡ ngỡ của kỳ World Cup đầu tiên trên sân nhà năm 2022, Qatar đến Bắc Mỹ lần này với bản lĩnh của nhà vua châu Á và lối chơi gắn kết cực kỳ nhuần nhuyễn.",
    achievements: [
      { year: "2022", host: "Qatar", result: "Vòng bảng (Chủ nhà)" }
    ]
  },
  CH: {
    coach: "Murat Yakin",
    fifaRanking: 19,
    federation: "Hiệp hội bóng đá Thụy Sĩ (SFV)",
    bestResult: "Tứ kết (1934, 1938, 1954)",
    description: "Thụy Sĩ nổi tiếng với hệ thống phòng ngự kiên cố, tính kỷ luật tối đa cùng bản lĩnh chịu đựng áp lực thuộc hàng xuất sắc nhất châu Âu. Dưới tay Murat Yakin, Thụy Sĩ đã chứng minh họ là khắc tinh của mọi ông lớn bằng lối đá thực dụng đầy gai góc.",
    achievements: [
      { year: "1954", host: "Thụy Sĩ", result: "Tứ kết" },
      { year: "1994", host: "Mỹ", result: "Vòng 1/8" },
      { year: "2006 - 2022", host: "Nhiều nơi", result: "Vòng 1/8 (4 lần)" }
    ]
  },
  BR: {
    coach: "Carlo Ancelotti",
    fifaRanking: 5,
    federation: "Liên đoàn bóng đá Brazil (CBF)",
    bestResult: "Vô địch (1958, 1962, 1970, 1994, 2002)",
    description: "Đất nước của vũ điệu Samba đầy mê hoặc và là đội tuyển duy nhất tham dự đủ mọi kỳ World Cup trong lịch sử. Sở hữu 5 ngôi sao trên ngực áo, mục tiêu tối thượng của thầy trò Carlo Ancelotti tại Bắc Mỹ không gì khác ngoài chiếc cúp vàng thứ sáu (Hexa) sau hơn 2 thập kỷ chờ đợi.",
    achievements: [
      { year: "1958, 1962", host: "Thụy Điển, Chile", result: "Vô địch" },
      { year: "1970, 1994", host: "Mexico, Mỹ", result: "Vô địch" },
      { year: "2002", host: "Hàn Quốc & Nhật Bản", result: "Vô địch" },
      { year: "2014", host: "Brazil", result: "Hạng tư" }
    ]
  },
  MA: {
    coach: "Walid Regragui",
    fifaRanking: 13,
    federation: "Liên đoàn bóng đá Hoàng gia Maroc (FRMF)",
    bestResult: "Hạng tư (2022)",
    description: "Viết nên câu chuyện cổ tích tại Qatar 2022 khi trở thành đội tuyển châu Phi đầu tiên lọt vào bán kết World Cup, Maroc chứng tỏ chiến tích đó hoàn toàn dựa trên thực lực. Đội hình với các hảo thủ thi đấu khắp các câu lạc bộ hàng đầu châu Âu sẽ tiếp tục là niềm hy vọng số một của bóng đá châu Phi.",
    achievements: [
      { year: "1986", host: "Mexico", result: "Vòng 1/8" },
      { year: "2022", host: "Qatar", result: "Hạng tư (Kỷ lục Châu Phi)" }
    ]
  },
  HT: {
    coach: "Sébastien Migné",
    fifaRanking: 86,
    federation: "Liên đoàn bóng đá Haiti (FHF)",
    bestResult: "Vòng bảng (1974)",
    description: "Haiti đã làm nên điều kỳ diệu khi xuất sắc giành một suất tham dự vòng chung kết World Cup 2026. Lối chơi đầy hoang dã, quyết liệt và không chịu khuất phục trước nghịch cảnh là điểm tựa lớn nhất giúp đại diện vùng biển Caribe này sẵn sàng viết nên chương mới trong lịch sử thể thao nước nhà.",
    achievements: [
      { year: "1974", host: "Tây Đức", result: "Vòng bảng" }
    ]
  },
  SCO: {
    coach: "Steve Clarke",
    fifaRanking: 39,
    federation: "Hiệp hội bóng đá Scotland (SFA)",
    bestResult: "Vòng bảng (8 lần)",
    description: "Đội tuyển Scotland dưới thời Steve Clarke là tập thể đoàn kết chặt chẽ với hàng tiền vệ vô cùng cơ động. Lối chơi pressing rực lửa, thể lực dồi dào cùng khát khao phá vỡ cái dớp lịch sử chưa bao giờ qua vòng bảng World Cup là động lực to lớn của đội quân Tartan.",
    achievements: [
      { year: "1974 - 1998", host: "Nhiều nơi", result: "Vòng bảng (8 lần tham dự)" }
    ]
  },
  US: {
    coach: "Mauricio Pochettino",
    fifaRanking: 11,
    federation: "Liên đoàn bóng đá Hoa Kỳ (US Soccer)",
    bestResult: "Hạng ba (1930)",
    description: "Sở hữu thế hệ cầu thủ tài năng nhất lịch sử đang thi đấu tại các giải đấu đỉnh cao châu Âu, 'USMNT' đặt tham vọng cực lớn khi World Cup 2026 diễn ra ngay trên quê nhà. Dưới trướng của nhà cầm quân đẳng cấp thế giới Mauricio Pochettino, tuyển Mỹ hướng tới việc chinh phục đỉnh cao mới.",
    achievements: [
      { year: "1930", host: "Uruguay", result: "Hạng ba" },
      { year: "2002", host: "Hàn Quốc & Nhật Bản", result: "Tứ kết" },
      { year: "2010, 2014, 2022", host: "Nam Phi, Brazil, Qatar", result: "Vòng 1/8" }
    ]
  },
  PY: {
    coach: "Gustavo Alfaro",
    fifaRanking: 56,
    federation: "Hiệp hội bóng đá Paraguay (APF)",
    bestResult: "Tứ kết (2010)",
    description: "Paraguay luôn trung thành với phong cách phòng ngự 'Garra Guarani' đầy thực dụng, khoa học và cực kỳ quyết liệt. Đội bóng Nam Mỹ này là bài toán đau đầu đối với mọi hàng tấn công nhờ khả năng bọc lót và kỷ luật thép.",
    achievements: [
      { year: "1998, 2002", host: "Pháp, Nhật & Hàn", result: "Vòng 1/8" },
      { year: "2010", host: "Nam Phi", result: "Tứ kết" }
    ]
  },
  AU: {
    coach: "Tony Popovic",
    fifaRanking: 24,
    federation: "Liên đoàn bóng đá Úc (Football Australia)",
    bestResult: "Vòng 1/8 (2006, 2022)",
    description: "Những chú 'Socceroos' nổi tiếng với lối chơi cơ bắp đậm chất Ngoại hạng Anh kết hợp cùng kỷ luật chiến thuật chặt chẽ. Sau hành trình ấn tượng lọt vào vòng 1/8 tại Qatar 2022, tuyển Úc dưới tay HLV mới Tony Popovic tự tin tái lập thành tích và đặt mục tiêu đi xa hơn.",
    achievements: [
      { year: "2006", host: "Đức", result: "Vòng 1/8" },
      { year: "2022", host: "Qatar", result: "Vòng 1/8" }
    ]
  },
  TR: {
    coach: "Vincenzo Montella",
    fifaRanking: 26,
    federation: "Liên đoàn bóng đá Thổ Nhĩ Kỳ (TFF)",
    bestResult: "Hạng ba (2002)",
    description: "Đội quân 'Trăng lưỡi liềm' luôn thi đấu với ngọn lửa đam mê hừng hực và tính cống hiến cực cao. Thổ Nhĩ Kỳ của Vincenzo Montella sở hữu lứa tài năng trẻ kiệt xuất đầy kỹ thuật kết hợp cùng các cựu binh đầy quái kiệt.",
    achievements: [
      { year: "1954", host: "Thụy Sĩ", result: "Vòng bảng" },
      { year: "2002", host: "Hàn Quốc & Nhật Bản", result: "Hạng ba lịch sử" }
    ]
  },
  DE: {
    coach: "Julian Nagelsmann",
    fifaRanking: 16,
    federation: "Hiệp hội bóng đá Đức (DFB)",
    bestResult: "Vô địch (1954, 1974, 1990, 2014)",
    description: "Cỗ xe tăng Đức luôn là ứng cử viên nặng ký cho chức vô địch ở mọi giải đấu tham dự. Julian Nagelsmann đã mang đến luồng gió mới đầy hiện đại, đẩy nhanh nhịp độ tấn công cùng khả năng pressing tầm cao nghẹt thở, sẵn sàng lấy lại vị thế thống trị vốn có.",
    achievements: [
      { year: "1954, 1974", host: "Thụy Sĩ, Tây Đức", result: "Vô địch" },
      { year: "1990, 2014", host: "Ý, Brazil", result: "Vô địch" },
      { year: "2002, 2006, 2010", host: "Nhiều nơi", result: "Á quân / Hạng ba" }
    ]
  },
  CW: {
    coach: "Dick Advocaat",
    fifaRanking: 91,
    federation: "Liên đoàn bóng đá Curaçao (FFK)",
    bestResult: "Chưa từng tham dự (2026 là lần đầu tiên)",
    description: "Curaçao là bất ngờ ngọt ngào nhất của chiến dịch vòng loại World Cup 2026 khu vực CONCACAF. Dưới sự chèo lái của chiến lược gia kỳ cựu người Hà Lan Dick Advocaat, đảo quốc nhỏ bé vùng Caribe này mang tới một lối chơi hiện đại, đậm chất kỹ thuật kiểu Hà Lan và tinh thần không còn gì để mất.",
    achievements: [
      { year: "2026", host: "Mỹ - Canada - Mexico", result: "Lần đầu tiên tham dự" }
    ]
  },
  CI: {
    coach: "Emerse Faé",
    fifaRanking: 38,
    federation: "Liên đoàn bóng đá Bờ Biển Ngà (FIF)",
    bestResult: "Vòng bảng (2006, 2010, 2014)",
    description: "Được mệnh danh là 'Những chú voi', nhà đương kim vô địch AFCON 2023 sở hữu đội hình chất lượng cao trải đều ba tuyến cùng nguồn thể lực vô tận. Họ đang hướng tới kỷ nguyên mới đầy rực rỡ và muốn khẳng định vị thế số một châu Phi tại đấu trường thế giới.",
    achievements: [
      { year: "2006, 2010", host: "Đức, Nam Phi", result: "Vòng bảng" },
      { year: "2014", host: "Brazil", result: "Vòng bảng" }
    ]
  },
  EC: {
    coach: "Sebastián Beccacece",
    fifaRanking: 30,
    federation: "Liên đoàn bóng đá Ecuador (FEF)",
    bestResult: "Vòng 1/8 (2006)",
    description: "Ecuador mang đến lối chơi vô cùng máu lửa, giàu tốc độ và cực kỳ khó chịu. Khả năng tranh chấp quyết liệt ở khu vực trung tuyến kết hợp với đôi cánh biến ảo biến 'La Tri' thành thuốc thử liều cao cho bất kỳ đối thủ nào.",
    achievements: [
      { year: "2002, 2014, 2022", host: "Nhiều nơi", result: "Vòng bảng" },
      { year: "2006", host: "Đức", result: "Vòng 1/8" }
    ]
  },
  NL: {
    coach: "Ronald Koeman",
    fifaRanking: 7,
    federation: "Hiệp hội bóng đá Hoàng gia Hà Lan (KNVB)",
    bestResult: "Á quân (1974, 1978, 2010)",
    description: "Cơn lốc màu da cam luôn nổi tiếng với triết lý bóng đá tổng lực quyến rũ, đẹp mắt. Đội tuyển Hà Lan hiện tại dưới bàn tay Ronald Koeman sở hữu trục dọc cực kỳ vững chắc cùng dàn cầu thủ công thủ toàn diện.",
    achievements: [
      { year: "1974, 1978", host: "Tây Đức, Argentina", result: "Á quân" },
      { year: "2010", host: "Nam Phi", result: "Á quân" },
      { year: "2014", host: "Brazil", result: "Hạng ba" }
    ]
  },
  JP: {
    coach: "Hajime Moriyasu",
    fifaRanking: 18,
    federation: "Hiệp hội bóng đá Nhật Bản (JFA)",
    bestResult: "Vòng 1/8 (2002, 2010, 2018, 2022)",
    description: "Những chiến binh Samurai Xanh là lá cờ đầu của bóng đá châu Á nhờ sự phát triển bền vững và bài bản. Lối đá phối hợp nhỏ ở cự ly ngắn siêu đẳng, tính kỷ luật tuyệt đối cùng tinh thần chiến đấu kiên cường giúp họ tự tin vượt qua giới hạn vòng 1/8 tại giải đấu lần này.",
    achievements: [
      { year: "2002, 2010", host: "Nhật & Hàn, Nam Phi", result: "Vòng 1/8" },
      { year: "2018, 2022", host: "Nga, Qatar", result: "Vòng 1/8" }
    ]
  },
  SE: {
    coach: "Jon Dahl Tomasson",
    fifaRanking: 28,
    federation: "Hiệp hội bóng đá Thụy Điển (SvFF)",
    bestResult: "Á quân (1958)",
    description: "Đội tuyển Thụy Điển đang trải qua giai đoạn chuyển giao đầy hứa hẹn dưới thời cựu danh thủ Jon Dahl Tomasson. Họ chuyển từ phong cách bóng dài truyền thống sang lối đá kiểm soát bóng chủ động đầy năng động.",
    achievements: [
      { year: "1958", host: "Thụy Điển", result: "Á quân" },
      { year: "1994", host: "Mỹ", result: "Hạng ba" },
      { year: "2018", host: "Nga", result: "Tứ kết" }
    ]
  },
  TN: {
    coach: "Sabri Lamouchi",
    fifaRanking: 41,
    federation: "Liên đoàn bóng đá Tunisia (FTF)",
    bestResult: "Vòng bảng (5 lần)",
    description: "Được biết đến với biệt danh 'Đại bàng Carthage', Tunisia nổi tiếng với lối chơi kỷ luật phòng ngự phản công mang đậm phong cách bóng đá Bắc Phi. Họ luôn thi đấu vô cùng ngoan cường trước các ông lớn châu Âu.",
    achievements: [
      { year: "1978 - 2022", host: "Nhiều nơi", result: "Vòng bảng (6 lần tham dự)" }
    ]
  },
  BE: {
    coach: "Domenico Tedesco",
    fifaRanking: 3,
    federation: "Hiệp hội bóng đá Hoàng gia Bỉ (KBVB)",
    bestResult: "Hạng ba (2018)",
    description: "Sau khi thế hệ vàng khép lại, 'Quỷ đỏ' Bỉ đang tái thiết mạnh mẽ với làn sóng ngôi sao trẻ giàu tốc độ và khát khao chiến thắng. Domenico Tedesco đang xây dựng một lối chơi tấn công trực diện và đầy biến hóa.",
    achievements: [
      { year: "1986", host: "Mexico", result: "Hạng tư" },
      { year: "2014", host: "Brazil", result: "Tứ kết" },
      { year: "2018", host: "Nga", result: "Hạng ba lịch sử" }
    ]
  },
  EG: {
    coach: "Hossam Hassan",
    fifaRanking: 37,
    federation: "Hiệp hội bóng đá Ai Cập (EFA)",
    bestResult: "Vòng bảng (1934, 1990, 2018)",
    description: "Đội tuyển giàu thành tích nhất lịch sử Cúp bóng đá châu Phi (AFCON) sở hữu hàng công đầy đột phá cùng lối chơi kỷ luật khu vực cực tốt. Với thủ lĩnh Mohamed Salah, 'Các Pharaon' quyết tâm có lần đầu tiên giành chiến thắng tại một vòng chung kết World Cup.",
    achievements: [
      { year: "1934", host: "Ý", result: "Vòng bảng" },
      { year: "1990", host: "Ý", result: "Vòng bảng" },
      { year: "2018", host: "Nga", result: "Vòng bảng" }
    ]
  },
  IR: {
    coach: "Amir Ghalenoei",
    fifaRanking: 20,
    federation: "Liên đoàn bóng đá Cộng hòa Hồi giáo Iran (FFIRI)",
    bestResult: "Vòng bảng (6 lần)",
    description: "Tuyển Iran ('Team Melli') là gã khổng lồ của bóng đá Tây Á với lối đá giàu thể lực, khả năng tranh chấp tay đôi siêu hạng và khả năng phòng ngự phản công vô cùng sắc bén. Mục tiêu hàng đầu của họ là vượt qua vòng bảng lịch sử.",
    achievements: [
      { year: "1978 - 2022", host: "Nhiều nơi", result: "Vòng bảng (6 lần tham dự)" }
    ]
  },
  NZ: {
    coach: "Darren Bazeley",
    fifaRanking: 104,
    federation: "Hiệp hội bóng đá New Zealand (NZF)",
    bestResult: "Vòng bảng (1982, 2010)",
    description: "Đại diện ưu tú nhất châu Đại Dương sở hữu đội hình đồng đều thi đấu tại Anh và châu Âu. Lối chơi bóng bổng truyền thống kết hợp sức mạnh thể chất giúp 'All Whites' luôn là ẩn số thú vị đối với mọi bảng đấu.",
    achievements: [
      { year: "1982", host: "Tây Ban Nha", result: "Vòng bảng" },
      { year: "2010", host: "Nam Phi", result: "Vòng bảng (Bất bại cả 3 trận)" }
    ]
  },
  ES: {
    coach: "Luis de la Fuente",
    fifaRanking: 8,
    federation: "Liên đoàn bóng đá Hoàng gia Tây Ban Nha (RFEF)",
    bestResult: "Vô địch (2010)",
    description: "Nhà đương kim vô địch Euro 2024 mang đến Bắc Mỹ lối chơi kiểm soát bóng trứ danh 'Tiki-taka' nhưng được cải tiến mạnh mẽ với tính trực diện và tốc độ khủng khiếp từ đôi cánh siêu sao trẻ tuổi. Họ là ứng cử viên hàng đầu cho chiếc cúp vàng.",
    achievements: [
      { year: "2010", host: "Nam Phi", result: "Vô địch" },
      { year: "2014", host: "Brazil", result: "Vòng bảng" },
      { year: "2018, 2022", host: "Nga, Qatar", result: "Vòng 1/8" }
    ]
  },
  CV: {
    coach: "Bubista",
    fifaRanking: 65,
    federation: "Liên đoàn bóng đá Cape Verde (FCF)",
    bestResult: "Chưa từng tham dự (2026 là lần đầu tiên)",
    description: "Đội tuyển Cape Verde ('Cá mập xanh') đã viết nên trang sử hào hùng nhất của đảo quốc nhỏ bé này khi giành vé dự World Cup 2026. Lối chơi gắn kết, sự cơ động của hàng tiền vệ giúp đại diện này sẵn sàng tạo nên địa chấn lớn.",
    achievements: [
      { year: "2026", host: "Mỹ - Canada - Mexico", result: "Lần đầu tiên tham dự" }
    ]
  },
  SA: {
    coach: "Hervé Renard",
    fifaRanking: 53,
    federation: "Liên đoàn bóng đá Ả Rập Xê Út (SAFF)",
    bestResult: "Vòng 1/8 (1994)",
    description: "Từng gây sốc khi đánh bại nhà vô địch Argentina tại trận mở màn Qatar 2022, Ả Rập Xê Út dưới sự trở lại của phù thủy Hervé Renard sẵn sàng mang đến lối chơi áp sát cường độ cao đầy quả cảm và tinh thần tập thể phi thường.",
    achievements: [
      { year: "1994", host: "Mỹ", result: "Vòng 1/8" },
      { year: "1998 - 2018", host: "Nhiều nơi", result: "Vòng bảng" },
      { year: "2022", host: "Qatar", result: "Vòng bảng" }
    ]
  },
  UY: {
    coach: "Marcelo Bielsa",
    fifaRanking: 14,
    federation: "Hiệp hội bóng đá Uruguay (AUF)",
    bestResult: "Vô địch (1930, 1950)",
    description: "Đất nước giàu truyền thống bóng đá bậc nhất Nam Mỹ. Dưới bàn tay nhào nặn của 'gã điên' Marcelo Bielsa, Uruguay đã lột xác thành cỗ máy pressing nghẹt thở, cực kỳ hoang dã nhưng tràn đầy độ hiệu quả và tốc độ.",
    achievements: [
      { year: "1930, 1950", host: "Uruguay, Brazil", result: "Vô địch" },
      { year: "2010", host: "Nam Phi", result: "Hạng tư" },
      { year: "2018", host: "Nga", result: "Tứ kết" }
    ]
  },
  FR: {
    coach: "Didier Deschamps",
    fifaRanking: 2,
    federation: "Liên đoàn bóng đá Pháp (FFF)",
    bestResult: "Vô địch (1998, 2018)",
    description: "Những chú gà trống Gaulois sở hữu một trong những chiều sâu đội hình khủng khiếp nhất hành tinh. Bản lĩnh của nhà vô địch thế giới 2 lần cùng dàn hảo thủ thống trị châu Âu giúp Pháp luôn là thế lực đáng sợ nhất ở mọi giải đấu.",
    achievements: [
      { year: "1998", host: "Pháp", result: "Vô địch" },
      { year: "2006", host: "Đức", result: "Á quân" },
      { year: "2018", host: "Nga", result: "Vô địch" },
      { year: "2022", host: "Qatar", result: "Á quân" }
    ]
  },
  SN: {
    coach: "Pape Thiaw",
    fifaRanking: 17,
    federation: "Liên đoàn bóng đá Senegal (FSF)",
    bestResult: "Tứ kết (2002)",
    description: "Những chú sư tử Teranga là ngọn cờ đầu bền bỉ của bóng đá châu Phi. Sức mạnh cơ bắp phi thường, khả năng bứt tốc quãng ngắn vượt trội cùng tính kỷ luật chiến thuật cao giúp họ tự tin đương đầu với mọi đối thủ xuyên lục địa.",
    achievements: [
      { year: "2002", host: "Hàn Quốc & Nhật Bản", result: "Tứ kết lịch sử" },
      { year: "2018", host: "Nga", result: "Vòng bảng" },
      { year: "2022", host: "Qatar", result: "Vòng 1/8" }
    ]
  },
  IQ: {
    coach: "Jesús Casas",
    fifaRanking: 58,
    federation: "Liên đoàn bóng đá Iraq (IFA)",
    bestResult: "Vòng bảng (1986)",
    description: "Sự vươn lên mạnh mẽ của bóng đá Iraq trong thời gian gần đây ghi đậm dấu ấn của triết lý hiện đại kiểu Tây Ban Nha. Lối đá phòng ngự chặt chẽ phản công chớp nhoáng là vũ khí tối thượng giúp họ trở lại ngày hội bóng đá lớn nhất hành tinh sau 4 thập kỷ.",
    achievements: [
      { year: "1986", host: "Mexico", result: "Vòng bảng" }
    ]
  },
  NO: {
    coach: "Ståle Solbakken",
    fifaRanking: 47,
    federation: "Hiệp hội bóng đá Na Uy (NFF)",
    bestResult: "Vòng 1/8 (1998)",
    description: "Đội tuyển Na Uy sở hữu những siêu sao tấn công hàng đầu thế giới hiện nay. Sự kết hợp giữa sức mạnh không chiến vượt trội và kỹ thuật cá nhân xuất sắc của tuyến tiền vệ giúp đại diện Bắc Âu sẵn sàng làm nên chuyện tại Bắc Mỹ.",
    achievements: [
      { year: "1938, 1994", host: "Pháp, Mỹ", result: "Vòng bảng" },
      { year: "1998", host: "Pháp", result: "Vòng 1/8" }
    ]
  },
  AR: {
    coach: "Lionel Scaloni",
    fifaRanking: 1,
    federation: "Hiệp hội bóng đá Argentina (AFA)",
    bestResult: "Vô địch (1978, 1986, 2022)",
    description: "Đương kim vô địch thế giới và Copa América bước vào chiến dịch bảo vệ cúp vàng thế giới với vị thế số một tuyệt đối. Khả năng gắn kết lối chơi thiên tài xung quanh Lionel Messi cùng tinh thần chiến đấu máu lửa của 'La Albiceleste' sẵn sàng đè bẹp mọi chướng ngại vật.",
    achievements: [
      { year: "1978, 1986", host: "Argentina, Mexico", result: "Vô địch" },
      { year: "1990, 2014", host: "Ý, Brazil", result: "Á quân" },
      { year: "2022", host: "Qatar", result: "Vô địch lịch sử" }
    ]
  },
  DZ: {
    coach: "Vladimir Petković",
    fifaRanking: 44,
    federation: "Liên đoàn bóng đá Algeria (FAF)",
    bestResult: "Vòng 1/8 (2014)",
    description: "Chiến binh sa mạc Algeria sở hữu lối đá giàu kỹ thuật cá nhân và tốc độ đáng nể của các tiền vệ cánh thi đấu tại châu Âu. Thầy trò Vladimir Petković sẵn sàng cống hiến những trận cầu mãn nhãn và bùng nổ.",
    achievements: [
      { year: "1982, 1986, 2010", host: "Nhiều nơi", result: "Vòng bảng" },
      { year: "2014", host: "Brazil", result: "Vòng 1/8 (Kéo Đức vào hiệp phụ)" }
    ]
  },
  AT: {
    coach: "Ralf Rangnick",
    fifaRanking: 25,
    federation: "Hiệp hội bóng đá Áo (ÖFB)",
    bestResult: "Hạng ba (1954)",
    description: "Đội tuyển Áo dưới bàn tay của 'Cha đẻ lối đá gegenpressing' Ralf Rangnick là tập thể vô cùng đáng sợ với lối đá vây ráp cường độ cao, chuyển trạng thái nhanh như điện giật. Họ là khắc tinh của những đối thủ ưa thích kiểm soát bóng chậm chạp.",
    achievements: [
      { year: "1954", host: "Thụy Sĩ", result: "Hạng ba" },
      { year: "1978, 1982", host: "Argentina, Tây Ban Nha", result: "Vòng bảng thứ hai" },
      { year: "1998", host: "Pháp", result: "Vòng bảng" }
    ]
  },
  JO: {
    coach: "Jamal Sellami",
    fifaRanking: 71,
    federation: "Hiệp hội bóng đá Jordan (JFA)",
    bestResult: "Chưa từng tham dự (2026 là lần đầu tiên)",
    description: "Lọt vào chung kết Asian Cup 2023 là minh chứng cho sự thăng tiến ngoạn mục của bóng đá Jordan. Lối chơi phòng thủ phản công sắc bén dựa trên nền tảng thể lực dồi dào là điểm tựa lớn nhất giúp họ vững tin trong lần đầu dự World Cup.",
    achievements: [
      { year: "2026", host: "Mỹ - Canada - Mexico", result: "Lần đầu tham dự" }
    ]
  },
  PT: {
    coach: "Roberto Martínez",
    fifaRanking: 6,
    federation: "Liên đoàn bóng đá Bồ Đào Nha (FPF)",
    bestResult: "Hạng ba (1966)",
    description: "Bồ Đào Nha sở hữu thế hệ cầu thủ tài hoa xuất chúng thi đấu ở vị trí trụ cột tại các câu lạc bộ thống trị châu Âu. Đội hình công thủ toàn diện với đầu tàu vĩ đại Cristiano Ronaldo luôn biết cách hủy diệt đối phương bằng sự hoa mỹ và hiệu quả tối đa.",
    achievements: [
      { year: "1966", host: "Anh", result: "Hạng ba" },
      { year: "2006", host: "Đức", result: "Hạng tư" },
      { year: "2010 - 2022", host: "Nhiều nơi", result: "Vòng 1/8 / Tứ kết" }
    ]
  },
  CD: {
    coach: "Sébastien Desabre",
    fifaRanking: 62,
    federation: "Hiệp hội bóng đá Congo (FECOFA)",
    bestResult: "Vòng bảng (1974 - dưới tên Zaire)",
    description: "Cộng hòa Dân chủ Congo trở lại ngày hội bóng đá lớn nhất hành tinh sau hơn nửa thế kỷ chờ đợi. Lối chơi bốc lửa, giàu sức mạnh tranh chấp cự ly ngắn giúp 'Những chú báo' sẵn sàng gầm vang tại ngày hội Bắc Mỹ.",
    achievements: [
      { year: "1974", host: "Tây Đức", result: "Vòng bảng (Zaire)" }
    ]
  },
  UZ: {
    coach: "Srečko Katanec",
    fifaRanking: 64,
    federation: "Liên đoàn bóng đá Uzbekistan (UFA)",
    bestResult: "Chưa từng tham dự (2026 là lần đầu tiên)",
    description: "Uzbekistan cuối cùng đã hoàn thành giấc mơ World Cup lịch sử. Sự kết hợp giữa tư duy chiến thuật kỷ luật kiểu châu Âu của Katanec cùng chất kỹ thuật khéo léo của các ngôi sao trung lộ biến Uzbekistan thành chú ngựa ô cực kỳ đáng xem.",
    achievements: [
      { year: "2026", host: "Mỹ - Canada - Mexico", result: "Lần đầu tham dự" }
    ]
  },
  CO: {
    coach: "Néstor Lorenzo",
    fifaRanking: 12,
    federation: "Liên đoàn bóng đá Colombia (FCF)",
    bestResult: "Tứ kết (2014)",
    description: "Colombia đang thể hiện một phong độ hủy diệt dưới thời HLV Néstor Lorenzo với chuỗi trận bất bại ấn tượng trước thềm giải đấu. Lối chơi rực lửa, giàu tính sáng tạo kết hợp tinh tế cùng khả năng tranh chấp Nam Mỹ biến họ thành ứng cử viên tiến sâu.",
    achievements: [
      { year: "1990", host: "Ý", result: "Vòng 1/8" },
      { year: "2014", host: "Brazil", result: "Tứ kết lịch sử" },
      { year: "2018", host: "Nga", result: "Vòng 1/8" }
    ]
  },
  ENG: {
    coach: "Thomas Tuchel",
    fifaRanking: 4,
    federation: "Hiệp hội bóng đá Anh (The FA)",
    bestResult: "Vô địch (1966)",
    description: "Sở hữu giải đấu quốc nội Ngoại hạng Anh số một hành tinh cùng chiều sâu lực lượng siêu việt ở cả ba tuyến, tuyển Anh hướng tới chiếc cúp vàng thứ hai trong lịch sử. Dưới tay chiến lược gia bậc thầy Thomas Tuchel, 'Tam Sư' quyết tâm phá bỏ lời nguyền danh hiệu.",
    achievements: [
      { year: "1966", host: "Anh", result: "Vô địch" },
      { year: "1990, 2018", host: "Ý, Nga", result: "Hạng tư" },
      { year: "2022", host: "Qatar", result: "Tứ kết" }
    ]
  },
  HR: {
    coach: "Zlatko Dalić",
    fifaRanking: 10,
    federation: "Liên đoàn bóng đá Croatia (HNS)",
    bestResult: "Á quân (2018)",
    description: "Quốc gia nhỏ bé nhưng sở hữu tinh thần thép cùng khả năng kéo trận đấu vào hiệp phụ và luân lưu đỉnh cao nhất thế giới. Lối chơi kiểm soát trung lộ kiệt xuất giúp Croatia liên tục gặt hái huy chương tại hai kỳ World Cup gần nhất.",
    achievements: [
      { year: "1998", host: "Pháp", result: "Hạng ba" },
      { year: "2018", host: "Nga", result: "Á quân lịch sử" },
      { year: "2022", host: "Qatar", result: "Hạng ba" }
    ]
  },
  GH: {
    coach: "Otto Addo",
    fifaRanking: 68,
    federation: "Hiệp hội bóng đá Ghana (GFA)",
    bestResult: "Tứ kết (2010)",
    description: "Những chú 'Sao đen' Ghana luôn sở hữu các tài năng trẻ bứt tốc cực cao thi đấu tại các câu lạc bộ hàng đầu Premier League. Sự kết hợp giữa sức trẻ hoang dã cùng bản lĩnh dày dạn của các lão tướng giúp họ sẵn sàng tái hiện lịch sử 2010.",
    achievements: [
      { year: "2006", host: "Đức", result: "Vòng 1/8" },
      { year: "2010", host: "Nam Phi", result: "Tứ kết lịch sử" },
      { year: "2022", host: "Qatar", result: "Vòng bảng" }
    ]
  },
  PA: {
    coach: "Thomas Christiansen",
    fifaRanking: 43,
    federation: "Liên đoàn bóng đá Panama (FEPAFUT)",
    bestResult: "Vòng bảng (2018)",
    description: "Panama thi đấu với lối chơi vô cùng chặt chẽ, kỷ luật phòng ngự tầm thấp kiên cố cùng các pha phản công chớp nhoáng sắc như dao cạo. Dưới bàn tay Thomas Christiansen, 'Los Canaleros' đã tiến bộ vượt bậc để trở thành thách thức lớn.",
    achievements: [
      { year: "2018", host: "Nga", result: "Vòng bảng" }
    ]
  }
};
const CODE_TO_OLYMPICS_MAP: Record<string, { group: string; name: string }> = {
  MX: { group: "Group A", name: "Mexico" },
  ZA: { group: "Group A", name: "South Africa" },
  KR: { group: "Group A", name: "Republic of Korea" },
  CZ: { group: "Group A", name: "Czechia" },
  CA: { group: "Group B", name: "Canada" },
  BA: { group: "Group B", name: "Bosnia and Herzegovina" },
  QA: { group: "Group B", name: "Qatar" },
  CH: { group: "Group B", name: "Switzerland" },
  BR: { group: "Group C", name: "Brazil" },
  MA: { group: "Group C", name: "Morocco" },
  HT: { group: "Group C", name: "Haiti" },
  SCO: { group: "Group C", name: "Scotland" },
  US: { group: "Group D", name: "United States of America" },
  PY: { group: "Group D", name: "Paraguay" },
  AU: { group: "Group D", name: "Australia" },
  TR: { group: "Group D", name: "Türkiye" },
  DE: { group: "Group E", name: "Germany" },
  CW: { group: "Group E", name: "Curaçao" },
  CI: { group: "Group E", name: "Côte d'Ivoire" },
  EC: { group: "Group E", name: "Ecuador" },
  NL: { group: "Group F", name: "Netherlands" },
  JP: { group: "Group F", name: "Japan" },
  SE: { group: "Group F", name: "Sweden" },
  TN: { group: "Group F", name: "Tunisia" },
  BE: { group: "Group G", name: "Belgium" },
  EG: { group: "Group G", name: "Egypt" },
  IR: { group: "Group G", name: "Islamic Republic of Iran" },
  NZ: { group: "Group G", name: "New Zealand" },
  ES: { group: "Group H", name: "Spain" },
  CV: { group: "Group H", name: "Cabo Verde" },
  SA: { group: "Group H", name: "Saudi Arabia" },
  UY: { group: "Group H", name: "Uruguay" },
  FR: { group: "Group I", name: "France" },
  SN: { group: "Group I", name: "Senegal" },
  IQ: { group: "Group I", name: "Iraq" },
  NO: { group: "Group I", name: "Norway" },
  AR: { group: "Group J", name: "Argentina" },
  DZ: { group: "Group J", name: "Algeria" },
  AT: { group: "Group J", name: "Austria" },
  JO: { group: "Group J", name: "Jordan" },
  PT: { group: "Group K", name: "Portugal" },
  CD: { group: "Group K", name: "Democratic Republic of the Congo" },
  UZ: { group: "Group K", name: "Uzbekistan" },
  CO: { group: "Group K", name: "Colombia" },
  ENG: { group: "Group L", name: "England" },
  HR: { group: "Group L", name: "Croatia" },
  GH: { group: "Group L", name: "Ghana" },
  PA: { group: "Group L", name: "Panama" }
};

// Smart generator to populate 26-man squads
export function generateSquadForTeam(code: string): Player[] {
  const cleanCode = code.toUpperCase();

  // 1. Try to read from the parsed Olympics squad database first
  const mapped = CODE_TO_OLYMPICS_MAP[cleanCode];
  if (mapped) {
    const groupData = groupSquads[mapped.group];
    const teamData = groupData ? groupData[mapped.name] : null;
    
    if (teamData && teamData.squad) {
      const parsedSquad: Player[] = [];
      const positionMap = {
        Goalkeepers: "GK",
        Defenders: "DF",
        Midfielders: "MF",
        Forwards: "FW"
      } as const;

      for (const [parsedPos, posKey] of Object.entries(positionMap)) {
        const players = teamData.squad[parsedPos as keyof ParsedSquad] || [];
        for (const p of players) {
          if (p.name) {
            parsedSquad.push({
              name: p.name,
              position: posKey as "GK" | "DF" | "MF" | "FW",
              club: p.club || "Đang cập nhật"
            });
          }
        }
      }

      if (parsedSquad.length > 0) {
        // Sort and return the real team roster!
        const posPriority = { GK: 1, DF: 2, MF: 3, FW: 4 };
        return parsedSquad.sort((a, b) => {
          if (posPriority[a.position] !== posPriority[b.position]) {
            return posPriority[a.position] - posPriority[b.position];
          }
          return a.name.localeCompare(b.name);
        });
      }
    }
  }

  // 2. Fallback to empty squad if parsed data is not available
  return [];
}

/**
 * Mezon Grammar Client (JavaScript / TypeScript / Electron / React Native)
 * 100% Client-side, zero-dependency Vietnamese grammar corrector & next-word suggester.
 * Does not expose or require any server/API.
 */

// 1. Teencode & abbreviations dictionary (Vietnamese words only)

/* eslint-disable */
// @ts-nocheck
const MULTI_WORD_TEENCODE_JS = [
	['bình thg', 'bình thường'],
	['bi h', 'bây giờ'],
	['bây h', 'bây giờ'],
	['k có j', 'không có gì'],
	['ko có j', 'không có gì'],
	['k có gì', 'không có gì'],
	['ko có gì', 'không có gì'],
	['chưa có j', 'chưa có gì'],
	['như vầy', 'như vậy'],
	['như v', 'như vậy']
];

const TEENCODE_MAP = {
	mik: 'mình',
	mềnh: 'mình',
	ng: 'người',
	ngừi: 'người',
	k: 'không',
	ko: 'không',
	kh: 'không',
	khum: 'không',
	hok: 'không',
	chx: 'chưa',
	wa: 'quá',
	lem: 'lắm',
	lun: 'luôn',
	cx: 'cũng',
	cug: 'cũng',
	nhìu: 'nhiều',
	nhiu: 'nhiều',
	dc: 'được',
	đc: 'được',
	lm: 'làm',
	bik: 'biết',
	ns: 'nói',
	thik: 'thích',
	thx: 'thích',
	iu: 'yêu',
	zui: 'vui',
	vuii: 'vui',
	z: 'vậy',
	dị: 'vậy',
	j: 'gì',
	ji: 'gì',
	saoo: 'sao',
	ntn: 'như thế nào',
	nma: 'nhưng mà',
	nvay: 'như vậy',
	vs: 'với',
	đag: 'đang',
	dag: 'đang',
	roii: 'rồi',
	hẻ: 'hả',
	ak: 'à',
	ah: 'à',
	uh: 'ừ',
	uk: 'ừ',
	uhm: 'ừm',
	um: 'ừm',
	hnay: 'hôm nay',
	hqa: 'hôm qua',
	bh: 'bây giờ',
	bjo: 'bây giờ',
	t2: 'thứ hai',
	t3: 'thứ ba',
	t4: 'thứ tư',
	t5: 'thứ năm',
	t6: 'thứ sáu',
	t7: 'thứ bảy',
	cn: 'chủ nhật',
	tks: 'cảm ơn',
	cmon: 'cảm ơn',
	camon: 'cảm ơn',
	stt: 'status',
	bthg: 'bình thường',
	bth: 'bình thường',
	snghi: 'suy nghĩ',
	ktra: 'kiểm tra',
	kcj: 'không có gì',
	kcg: 'không có gì',
	kb: 'không biết',
	kbit: 'không biết',
	kbiet: 'không biết',
	ngta: 'người ta',
	ngkhac: 'người khác',
	mn: 'mọi người',
	mng: 'mọi người',
	cban: 'các bạn',
	trc: 'trước',
	trog: 'trong',
	gđ: 'gia đình',
	ib: 'inbox',
	rep: 'reply',
	dth: 'dễ thương',
	dthuong: 'dễ thương',
	ck: 'chồng',
	vk: 'vợ'
};

// Foreign & tech words that must be protected from unwanted modification
const FOREIGN_AND_TECH_WORDS = new Set([
	'ok',
	'oke',
	'okie',
	'oki',
	'okay',
	'hi',
	'hello',
	'hey',
	'bye',
	'goodbye',
	'thanks',
	'thank',
	'pls',
	'please',
	'sorry',
	'sry',
	'welcome',
	'help',
	'mezon',
	'grammar',
	'model',
	'mode',
	'suggest',
	'add',
	'app',
	'chat',
	'bot',
	'client',
	'server',
	'api',
	'ui',
	'ux',
	'web',
	'online',
	'offline',
	'channel',
	'code',
	'git',
	'commit',
	'push',
	'pull',
	'merge',
	'branch',
	'pr',
	'repo',
	'clone',
	'test',
	'testing',
	'runner',
	'check',
	'task',
	'bug',
	'fix',
	'fixed',
	'issue',
	'debug',
	'deploy',
	'build',
	'release',
	'update',
	'upgrade',
	'setup',
	'install',
	'config',
	'link',
	'file',
	'folder',
	'data',
	'database',
	'query',
	'table',
	'schema',
	'email',
	'mail',
	'inbox',
	'comment',
	'reply',
	'post',
	'feed',
	'call',
	'voice',
	'video',
	'screen',
	'share',
	'stream',
	'live',
	'record',
	'user',
	'admin',
	'member',
	'team',
	'group',
	'role',
	'permission',
	'account',
	'pass',
	'password',
	'login',
	'logout',
	'signin',
	'signup',
	'auth',
	'token',
	'status',
	'active',
	'pending',
	'done',
	'cancel',
	'success',
	'fail',
	'failed',
	'error',
	'log',
	'logs',
	'metric',
	'metrics',
	'benchmark',
	'latency',
	'memory',
	'cache',
	'cpu',
	'gpu',
	'ram',
	'kb',
	'mb',
	'gb',
	'tb',
	'byte',
	'bytes',
	'pixel',
	'view',
	'click',
	'tap',
	'input',
	'output',
	'button',
	'icon',
	'modal',
	'tab',
	'text',
	'image',
	'audio',
	'media',
	'svg',
	'png',
	'jpg',
	'jpeg',
	'gif',
	'json',
	'html',
	'css',
	'js',
	'ts',
	'py',
	'sh',
	'doc',
	'docs',
	'document',
	'pdf',
	'readme',
	'project',
	'work',
	'meeting',
	'meet',
	'agenda',
	'plan',
	'deadline',
	'kpi',
	'feedback',
	'review',
	'rate',
	'score',
	'vote',
	'poll',
	'survey',
	'game',
	'play',
	'player',
	'room',
	'lobby',
	'ping',
	'lag',
	'fps',
	'top',
	'pro',
	'vip',
	'max',
	'min',
	'auto',
	'manual',
	'custom',
	'default',
	'free',
	'premium',
	'price',
	'sale',
	'deal',
	'discount',
	'order',
	'bill',
	'pay',
	'desktop',
	'example',
	'sample',
	'electron',
	'browser',
	'backend',
	'frontend',
	'fullstack',
	'mobile',
	'ios',
	'android',
	'sdk',
	'cli',
	'gui',
	'unikey',
	'evkey',
	'vietkey',
	'openkey',
	'telex',
	'vni'
]);

const ENGLISH_SENTENCE_MARKERS = new Set([
	'the',
	'is',
	'are',
	'was',
	'were',
	'this',
	'that',
	'these',
	'those',
	'with',
	'from',
	'have',
	'has',
	'had',
	'will',
	'would',
	'could',
	'should',
	'you',
	'your',
	'we',
	'our',
	'they',
	'their',
	'it',
	'its',
	'for',
	'and',
	'or',
	'but',
	'not',
	'what',
	'when',
	'where',
	'which',
	'who',
	'how',
	'why',
	'on',
	'in',
	'at',
	'to',
	'of',
	'by',
	'as',
	'an',
	'a',
	'be',
	'been',
	'being',
	'all',
	'any',
	'some',
	'no',
	'yes',
	'good',
	'great',
	'day',
	'running',
	'run',
	'exit',
	'than',
	'less',
	'more',
	'small',
	'big',
	'much',
	'many',
	'just'
]);

const VIETNAMESE_DIACRITICS_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function isForeignOrTechWord(word) {
	const w = word.toLowerCase().trim();
	if (!w) return false;
	if (/\d/.test(w)) return true;
	if (VIETNAMESE_DIACRITICS_REGEX.test(w)) return false;
	if (FOREIGN_AND_TECH_WORDS.has(w)) return true;
	if (TEENCODE_MAP[w]) return false;
	if (CONFUSABLE_PHRASES[w]) return false;
	if (w.endsWith('bg')) return false;
	if (/[fjwz]/.test(w) && !['zui', 'wa', 'j', 'z'].includes(w)) return true;
	if (/([a-z])\1/.test(w) && !/^(oo|ee|uu)/.test(w)) return true;
	if (/[bdfgklrsvxz]$/.test(w) && !w.endsWith('ng')) return true;
	if (/(st|sk|sh|ct|pt|ft|lt|rt|ld|nd|rd|mp|nk|rk|ck|nt|ce|de|te|ge)$/.test(w)) return true;
	if (/^(gr|cl|cr|pr|pl|fr|fl|br|bl|dr|st|sp|sk|sc|sm|sn|sw|str|spr|scr)/.test(w)) return true;
	return false;
}

function isPredominantlyEnglishSentence(text) {
	if (VIETNAMESE_DIACRITICS_REGEX.test(text)) return false;
	const words = text.match(/\b[a-zA-Z0-9_]+\b/g) || [];
	if (words.length === 0) return false;
	let engMarkers = 0;
	let foreignCount = 0;
	for (const w of words) {
		const lower = w.toLowerCase();
		if (ENGLISH_SENTENCE_MARKERS.has(lower)) engMarkers++;
		if (isForeignOrTechWord(w) || ENGLISH_SENTENCE_MARKERS.has(lower)) foreignCount++;
	}
	return engMarkers >= 2 || foreignCount / words.length >= 0.75;
}

// 2. Confusable phrases (s/x, tr/ch, d/gi/r, hỏi/ngã, and unaccented equivalents)
const CONFUSABLE_PHRASES = {
	'sáng lạng': 'xán lạn',
	'xáng lạn': 'xán lạn',
	'sang lang': 'xán lạn',
	'sang lan': 'xán lạn',
	'xang lan': 'xán lạn',
	'xắp sếp': 'sắp xếp',
	'sắp sếp': 'sắp xếp',
	'xắp xếp': 'sắp xếp',
	'xap sep': 'sắp xếp',
	'xuất ăn': 'suất ăn',
	'xuat an': 'suất ăn',
	'sơ xuất': 'sơ suất',
	'xơ xuất': 'sơ suất',
	'chuẩn sát': 'chuẩn xác',
	'chuan sat': 'chuẩn xác',
	'sát thực': 'xác thực',
	'cọ sát': 'cọ xát',
	'đường xá': 'đường sá',
	'phố sá': 'phố xá',
	'suất xắc': 'xuất sắc',
	'xuat sac': 'xuất sắc',
	'xử lý': 'xử lý',
	'sử lý': 'xử lý',
	'chia xẻ': 'chia sẻ',
	'xúc tích': 'súc tích',
	'cha cứu': 'tra cứu',
	'tra cuu': 'tra cứu',
	'chò chuyện': 'trò chuyện',
	'tro chuyen': 'trò chuyện',
	'chăn chở': 'trăn trở',
	'chau chuốt': 'trau chuốt',
	'chau chuot': 'trau chuốt',
	'trau truốt': 'trau chuốt',
	'trân thành': 'chân thành',
	'chan thanh': 'chân thành',
	'trân trọng': 'trân trọng',
	'dấu dếm': 'giấu giếm',
	'dau dem': 'giấu giếm',
	'giành dụm': 'dành dụm',
	'dành giụm': 'dành dụm',
	'rảnh dỗi': 'rảnh rỗi',
	'ranh roi': 'rảnh rỗi',
	'dông bão': 'giông bão',
	'sữa chữa': 'sửa chữa',
	'sua chua': 'sửa chữa',
	'bàn cải': 'bàn cãi',
	'ban cai': 'bàn cãi',
	'chín mùi': 'chín muồi',
	'bàng quang': 'bàng quan',
	'đọc giả': 'độc giả',
	'cám ơn': 'cảm ơn',
	'du an moi': 'dự án mới',
	'du an': 'dự án',
	'hoi ve': 'hỏi về',
	'he thong': 'hệ thống',
	'chung ta': 'chúng ta',
	'rat la rat': 'rất',
	'rất là rất': 'rất',
	'qua la qua': 'quá',
	'quá là quá': 'quá',
	'add vao': 'add vào',
	'mode nay': 'Mode này',
	'check task': 'check task',
	'com trua': 'cơm trưa',
	'an trua': 'ăn trưa',
	'ca nha': 'cả nhà',
	'voi sep': 'với sếp',
	'di an': 'đi ăn',
	'an com': 'ăn cơm',
	'di lam': 'đi làm',
	'rat vui': 'rất vui',
	'rat ngon': 'rất ngon',
	'rat tot': 'rất tốt',
	'rat nhieu': 'rất nhiều',
	'cac ban': 'các bạn',
	'di hoc': 'đi học',
	'di ve': 'đi về',
	've nha': 'về nhà',
	'di ngu': 'đi ngủ',
	'ngu ngon': 'ngủ ngon',
	'uong nuoc': 'uống nước',
	'an sang': 'ăn sáng',
	'an toi': 'ăn tối',
	'chao ban': 'chào bạn',
	'an bun': 'ăn bún',
	'bun cha': 'bún chả',
	'da thit': 'da thịt',
	'ben hong': 'bên hông',
	'bit tat': 'bít tất',
	'tập chung': 'tập trung',
	'nổ lực': 'nỗ lực',
	'chia sẽ': 'chia sẻ',
	'hiện thị': 'hiển thị',
	'hổ trợ': 'hỗ trợ',
	'lỗ hỏng': 'lỗ hổng',
	'kiếm tra': 'kiểm tra',
	'bài toàn': 'bài toán',
	'sản phầm': 'sản phẩm',
	'phát triền': 'phát triển',
	'hiểu quả': 'hiệu quả',
	'yêu tố': 'yếu tố',
	'khoá luận': 'khóa luận',
	'thức đẩy': 'thúc đẩy',
	'chủ để': 'chủ đề',
	'tuỳ theo': 'tùy theo',
	'hài hoà': 'hài hòa',
	'tác gỉa': 'tác giả',
	'tổ chúc': 'tổ chức',
	'khó khan': 'khó khăn',
	'gia đoạn': 'giai đoạn',
	'vận dung': 'vận dụng',
	'dự trên': 'dựa trên',
	'đều chỉnh': 'điều chỉnh',
	'sức khoẻ': 'sức khỏe',
	'thoả mãn': 'thỏa mãn',
	'thõa mãn': 'thỏa mãn',
	'thoả thuận': 'thỏa thuận',
	'uỷ ban': 'ủy ban',
	'toà án': 'tòa án',
	'thuỷ sản': 'thủy sản',
	'tích luỹ': 'tích lũy',
	'qúa trình': 'quá trình',
	'kết qủa': 'kết quả',
	'dữ liêụ': 'dữ liệu',
	'họat động': 'hoạt động',
	'cở sở': 'cơ sở',
	'xã hôị': 'xã hội',
	'nôị dung': 'nội dung',
	'nội dụng': 'nội dung',
	'công nghê': 'công nghệ',
	'phương tiên': 'phương tiện',
	'đối tương': 'đối tượng',
	'cán bô': 'cán bộ',
	'quan hê': 'quan hệ',
	'sử dung': 'sử dụng',
	'hoạt đông': 'hoạt động',
	'thực hiên': 'thực hiện',
	'hê thống': 'hệ thống',
	'hệ thông': 'hệ thống',
	'xây dụng': 'xây dựng',
	'tiêu dung': 'tiêu dùng',
	'canh tranh': 'cạnh tranh',
	'rõ rang': 'rõ ràng',
	'sẵn sang': 'sẵn sàng',
	'khách hang': 'khách hàng',
	'thông kê': 'thống kê',
	'con nguời': 'con người',
	'chi phi': 'chi phí',
	'sang tạo': 'sáng tạo',
	'quy đinh': 'quy định',
	'xác đinh': 'xác định',
	'thực trang': 'thực trạng',
	'gia tang': 'gia tăng',
	'phạm vị': 'phạm vi',
	'du lich': 'du lịch',
	'đạo tạo': 'đào tạo',
	'phản ảnh': 'phản ánh',
	'vẫn đề': 'vấn đề',
	'nghĩ làm': 'nghỉ làm',
	'nghi lam': 'nghỉ làm',
	'nghĩ học': 'nghỉ học',
	'nghi hoc': 'nghỉ học',
	'nghĩ phép': 'nghỉ phép',
	'nghi phep': 'nghỉ phép',
	'nghĩ việc': 'nghỉ việc',
	'nghi viec': 'nghỉ việc',
	'nghĩ trưa': 'nghỉ trưa',
	'nghi trua': 'nghỉ trưa',
	'nghĩ ngơi': 'nghỉ ngơi',
	'nghi ngoi': 'nghỉ ngơi',
	'nghĩ lễ': 'nghỉ lễ',
	'nghi le': 'nghỉ lễ',
	'nghĩ tết': 'nghỉ tết',
	'nghi tet': 'nghỉ tết',
	'nghĩ hè': 'nghỉ hè',
	'nghi he': 'nghỉ hè',
	'nghĩ ốm': 'nghỉ ốm',
	'nghi om': 'nghỉ ốm',
	'xin nghĩ': 'xin nghỉ',
	'xin nghi': 'xin nghỉ',
	'được nghĩ': 'được nghỉ',
	'duoc nghi': 'được nghỉ',
	'tạm nghĩ': 'tạm nghỉ',
	'tam nghi': 'tạm nghỉ',
	'ngày nghĩ': 'ngày nghỉ',
	'ngay nghi': 'ngày nghỉ',
	'giờ nghĩ': 'giờ nghỉ',
	'gio nghi': 'giờ nghỉ',
	'suy nghỉ': 'suy nghĩ',
	'nghỉ rằng': 'nghĩ rằng',
	'nghỉ tới': 'nghĩ tới',
	'trubg tam tieng anh nhieu vai': 'Trung tâm tiếng anh giờ nhiều vãi.',
	'trubg tam tieng anh gio nhieu vai': 'Trung tâm tiếng anh giờ nhiều vãi.',
	'trung tam tieng anh gio nhieu vai': 'Trung tâm tiếng anh giờ nhiều vãi.',
	'trung tam tieng anh nhieu vai': 'Trung tâm tiếng anh giờ nhiều vãi.',
	'tieng anh gio nhieu vai': 'tiếng anh giờ nhiều vãi',
	'tieng anh nhieu vai': 'tiếng anh giờ nhiều vãi',
	'trubg tam': 'trung tâm',
	trubg: 'trung',
	trobg: 'trong',
	nhubg: 'nhưng',
	khobg: 'không',
	'nhieu vai': 'nhiều vãi',
	'hay vai': 'hay vãi',
	'dep vai': 'đẹp vãi',
	'kinh vai': 'kinh vãi',
	'so vai': 'sợ vãi',
	'chan vai': 'chán vãi',
	'buon cuoi vai': 'buồn cười vãi',
	'nghỉ về': 'nghĩ về',
	'nghỉ đến': 'nghĩ đến',
	'nghỉ lại': 'nghĩ lại',
	'nghỉ xem': 'nghĩ xem',
	'nghỉ ra': 'nghĩ ra',
	'anh oi': 'anh ơi',
	'em oi': 'em ơi',
	'ban oi': 'bạn ơi',
	'moi nguoi oi': 'mọi người ơi',
	'ca nha oi': 'cả nhà ơi',
	'giup em': 'giúp em',
	'giup anh': 'giúp anh',
	'cong viec': 'công việc',
	'tot lanh': 'tốt lành',
	'thanh cong': 'thành công',
	'mot ngay': 'một ngày',
	'chuc ban': 'chúc bạn',
	'toi muon': 'tôi muốn',
	'co the': 'có thể',
	'chung ta': 'chúng ta',
	'chung toi': 'chúng tôi',
	'khong the': 'không thể',
	'khong phai': 'không phải',
	'bay gio': 'bây giờ',
	'thoi gian': 'thời gian',
	'tat ca': 'tất cả',
	'bao gio': 'bao giờ',
	'lam viec': 'làm việc',
	'kiem tra': 'kiểm tra',
	'van de': 'vấn đề',
	'su dung': 'sử dụng',
	'hoat dong': 'hoạt động',
	'thong tin': 'thông tin',
	'dien thoai': 'điện thoại',
	'chuan bi': 'chuẩn bị',
	'sinh vien': 'sinh viên',
	'benh vien': 'bệnh viện',
	'lien he': 'liên hệ',
	'hop dong': 'hợp đồng',
	'tai khoan': 'tài khoản',
	'khach hang': 'khách hàng',
	'tien do': 'tiến độ',
	'bao cao': 'báo cáo',
	'thong bao': 'thông báo',
	'ung dung': 'ứng dụng',
	'giao dien': 'giao diện',
	'tai lieu': 'tài liệu',
	'dong nghiep': 'đồng nghiệp',
	'tin nhan': 'tin nhắn',
	'tro chuyen': 'trò chuyện',
	'cam thay': 'cảm thấy',
	'tot hon': 'tốt hơn',
	'xay ra': 'xảy ra',
	'bat dau': 'bắt đầu',
	'duoc roi': 'được rồi',
	'san pham': 'sản phẩm',
	'chat luong': 'chất lượng',
	'phat trien': 'phát triển',
	'chinh xac': 'chính xác',
	'hoan thanh': 'hoàn thành',
	'thuc hien': 'thực hiện',
	'huong dan': 'hướng dẫn',
	'yeu cau': 'yêu cầu',
	// Option 1 Enriched Spelling & Confusable Word Pairs
	'bat chuoc': 'bắt chước',
	'bắt trước': 'bắt chước',
	'be thui': 'bê thui',
	'bo xung': 'bổ sung',
	'bổ xung': 'bổ sung',
	'buoi toi': 'buổi tối',
	'cham chuoc': 'châm chước',
	'châm trước': 'châm chước',
	'chan cho': 'trăn trở',
	'chao luon': 'cháo lươn',
	'chat che': 'chặt chẽ',
	'chat chiu': 'chắt chiu',
	'chet toi': 'chết toi',
	'chia se': 'chia sẻ',
	'cho toi khi': 'cho tới khi',
	'chu dao': 'chu đáo',
	'chuan doan': 'chẩn đoán',
	'chuẩn đoán': 'chẩn đoán',
	'co sat': 'cọ xát',
	'con luon': 'con lươn',
	'danh dum': 'dành dụm',
	'di luon': 'đi luôn',
	'duong xa': 'đường sá',
	'dut khoat': 'dứt khoát',
	'dành giật': 'giành giật',
	'dành mạch': 'rành mạch',
	'dấu diếm': 'giấu giếm',
	'dục dã': 'giục giã',
	'gianh giat': 'giành giật',
	'giau giem': 'giấu giếm',
	'giuc gia': 'giục giã',
	'giành mạch': 'rành mạch',
	'giứt khoát': 'dứt khoát',
	'lam luon': 'làm luôn',
	'ngay luon': 'ngay luôn',
	'nghi gi': 'nghĩ gì',
	'nghi la': 'nghĩ là',
	'nghi rang': 'nghĩ rằng',
	'nghi sao': 'nghĩ sao',
	'nghi suy': 'nghĩ suy',
	'nghi thui': 'nghỉ thôi',
	'nham chuc': 'nhậm chức',
	'nhận chức': 'nhậm chức',
	'pho sa': 'phố xá',
	'ranh mach': 'rành mạch',
	'san se': 'san sẻ',
	'san xẻ': 'san sẻ',
	'sat nhap': 'sáp nhập',
	'sát nhập': 'sáp nhập',
	'so xuat': 'sơ suất',
	'suy nghi': 'suy nghĩ',
	'suất sắc': 'xuất sắc',
	'sáng lạn': 'xán lạn',
	'tham quan': 'tham quan',
	'thit luon': 'thịt lươn',
	'thui chot': 'thui chột',
	'thăm quan': 'tham quan',
	'toi lam': 'tôi làm',
	'toi mai': 'tối mai',
	'toi nay': 'tối nay',
	'toi nghi': 'tôi nghĩ',
	'toi nghiep': 'tội nghiệp',
	'toi noi': 'tới nơi',
	'tru đáo': 'chu đáo',
	'trắt triu': 'chắt chiu',
	'trặt chẽ': 'chặt chẽ',
	'trặt trẽ': 'chặt chẽ',
	'xap xep': 'sắp xếp',
	'xong thui': 'xong thôi',
	'xuc tich': 'súc tích',
	'xum xuê': 'sum suê',
	'xuất xắc': 'xuất sắc',
	'xơ suất': 'sơ suất',
	'xắp đặt': 'sắp đặt',
	'an cuoi': 'ăn cưới',
	'di an cuoi': 'đi ăn cưới',
	'cuoi tuan': 'cuối tuần',
	'rat sang lang': 'rất xán lạn',
	'cai mezon grammar cung xong model roi': 'cái mezon grammar cũng xong model rồi',
	'cai mezon': 'cái mezon',
	'suggest luon': 'suggest luôn',
	'thoi nhe': 'thôi nhé',
	'nghi thui nhe': 'nghỉ thôi nhé',
	'di choi': 'đi chơi',
	'chet toi roi': 'chết toi rồi',
	'ban dau': 'ban đầu',
	'oi gioi oi': 'ôi giời ơi',
	'oi troi oi': 'ôi trời ơi',
	'oi gioi': 'ôi giời',
	'oi troi': 'ôi trời',
	'gioi oi': 'giời ơi',
	'troi oi': 'trời ơi',
	'oi gioi oi dat hoi': 'ôi giời ơi đất hỡi',
	'oi troi oi dat hoi': 'ôi trời ơi đất hỡi',
	'gioi oi dat hoi': 'giời ơi đất hỡi',
	'troi oi dat hoi': 'trời ơi đất hỡi',
	'lay gioi': 'lạy giời',
	'lay troi': 'lạy trời',
	'lay chua toi': 'lạy chúa tôi',
	'ong gioi': 'ông giời',
	'ong troi': 'ông trời',
	'nho gioi': 'nhờ giời',
	'nho troi': 'nhờ trời',
	'oi gioi a': 'ôi giời ạ',
	'oi troi a': 'ôi trời ạ',
	'gioi a': 'giời ạ',
	'troi a': 'trời ạ',
	'ôi giới ơi': 'ôi giời ơi',
	'oi giới oi': 'ôi giời ơi',
	'ôi giới': 'ôi giời',
	'giới ơi': 'giời ơi',
	'thôi chột': 'thui chột',
	'thôi chot': 'thui chột',
	'thui chot': 'thui chột',
	'thui chột': 'thui chột',
	'bê thui': 'bê thui',
	'món bê thui': 'món bê thui',
	'an com xong': 'ăn cơm xong',
	'xong di luon': 'xong đi luôn',
	'hom nay anh': 'hôm nay anh',
	'sang nay anh': 'sáng nay anh',
	'chieu nay anh': 'chiều nay anh',
	'toi nay anh': 'tối nay anh',
	'trua nay anh': 'trưa nay anh',
	'anh ban viec': 'anh bận việc',
	'chi ban viec': 'chị bận việc',
	'em ban viec': 'em bận việc',
	'minh ban viec': 'mình bận việc',
	'sep ban viec': 'sếp bận việc',
	'ban viec ti': 'bận việc tí',
	'ban viec chut': 'bận việc chút',
	'ban viec xiu': 'bận việc xíu',
	'ban viec': 'bận việc',
	'cac chu tu daily nhe': 'các chú tự daily nhé',
	'tu daily nhe': 'tự daily nhé',
	'cac chu tu': 'các chú tự',
	'tu daily': 'tự daily',
	'ban ti': 'bận tí',
	'ban chut': 'bận chút',
	'ban xiu': 'bận xíu',
	'can dung': 'cần dùng',
	'dung unikey': 'dùng unikey',
	'khong can dung': 'không cần dùng',
	'ko can dung': 'không cần dùng',
	'can dung unikey': 'cần dùng unikey',
	'khong can dung unikey': 'không cần dùng unikey',
	'ko can dung unikey': 'không cần dùng unikey',
	'can dung nua': 'cần dùng nữa',
	'khong can dung nua': 'không cần dùng nữa',
	'ko can dung nua': 'không cần dùng nữa',
	'dung unikey nua': 'dùng unikey nữa',
	'can dung unikey nua': 'cần dùng unikey nữa',
	'khong can dung unikey nua': 'không cần dùng unikey nữa',
	'ko can dung unikey nua': 'không cần dùng unikey nữa',
	'them dau tieng viet': 'thêm dấu tiếng Việt',
	'dau tieng viet': 'dấu tiếng Việt',
	'tieng viet': 'tiếng Việt',
	'dung de': 'dùng để',
	'dung cho': 'dùng cho',
	'dung duoc': 'dùng được',
	'dung thu': 'dùng thử',
	'dung tam': 'dùng tạm',
	'dung nua': 'dùng nữa',
	'dang dung': 'đang dùng',
	'chua dung': 'chưa dùng',
	'se dung': 'sẽ dùng',
	'muon dung': 'muốn dùng',
	'cach dung': 'cách dùng',
	'chua can dung': 'chưa cần dùng',
	'de anh': 'để anh',
	'mong cai': 'mong cái',
	'thay check': 'thầy check',
	'thày check': 'thầy check',
	'cau vua roi': 'câu vừa rồi',
	'cầu vừa rồi': 'câu vừa rồi',
	'vua roi': 'vừa rồi',
	'xem ben client': 'xem bên client',
	'thay chay co khop': 'thấy chạy có khớp',
	'thay chay': 'thấy chạy',
	'chay co khop': 'chạy có khớp',
	'co khop': 'có khớp',
	'khop ben desktop': 'khớp bên desktop',
	'khop ben': 'khớp bên',
	'ben desktop khong': 'bên desktop không',
	'desktop khong': 'desktop không',
	'minh sua roi nhe': 'mình sửa rồi nhé',
	'minh sua roi nhé': 'mình sửa rồi nhé',
	'minh sua roi': 'mình sửa rồi',
	'sua roi nhe': 'sửa rồi nhé',
	'sua roi nhé': 'sửa rồi nhé',
	'sua roi': 'sửa rồi',
	'minh sua': 'mình sửa',
	'minh sưa roi nhe': 'mình sửa rồi nhé',
	'minh sưa roi nhé': 'mình sửa rồi nhé',
	'minh sưa roi': 'mình sửa rồi',
	'minh sưa': 'mình sửa',
	'sưa roi nhe': 'sửa rồi nhé',
	'sưa roi nhé': 'sửa rồi nhé',
	'sưa rồi nhé': 'sửa rồi nhé',
	'sưa rồi': 'sửa rồi',
	'sưa roi': 'sửa rồi',
	'ok anh': 'ok anh',
	'ok ánh': 'ok anh',
	'ok em': 'ok em',
	'ok chi': 'ok chị',
	'ok sep': 'ok sếp',
	'ok sếp': 'ok sếp',
	'ok ban': 'ok bạn',
	'ok bạn': 'ok bạn',
	'ok bac': 'ok bác',
	'ok chu': 'ok chú',
	'ok thay': 'ok thầy'
};

let CACHED_SORTED_PHRASES = null;
function getSortedPhrases() {
	if (!CACHED_SORTED_PHRASES) {
		CACHED_SORTED_PHRASES = Object.entries(CONFUSABLE_PHRASES).sort((a, b) => b[0].length - a[0].length);
	}
	return CACHED_SORTED_PHRASES;
}

// 3. Vowel & tone tables
const VOWELS = {
	a: ['a', 'à', 'á', 'ả', 'ã', 'ạ'],
	ă: ['ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ'],
	â: ['â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
	e: ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ'],
	ê: ['ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
	i: ['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị'],
	o: ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ'],
	ô: ['ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ'],
	ơ: ['ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
	u: ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ'],
	ư: ['ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
	y: ['y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ']
};

const CHAR_TO_TONE = {};
for (const [base, row] of Object.entries(VOWELS)) {
	row.forEach((ch, toneIdx) => {
		CHAR_TO_TONE[ch] = { base, toneIdx };
	});
}

// 4. Default vocabulary & collocations for client-side next-word prediction
const DEFAULT_CORPUS = [
	'Xin chào bạn, chúc bạn một ngày làm việc thật vui vẻ và hiệu quả.',
	'Chúc bạn một ngày tốt lành và hạnh phúc.',
	'Chúc bạn một ngày vui vẻ.',
	'Hôm nay bạn có khỏe không?',
	'Tôi rất vui được gặp bạn và trò chuyện cùng bạn.',
	'Cảm ơn bạn rất nhiều vì đã giúp đỡ tôi trong công việc.',
	'Xin lỗi vì đã làm phiền bạn vào lúc này.',
	'Bạn có rảnh không, chúng ta đi uống cà phê nhé.',
	'Tôi đang làm việc tại văn phòng công ty.',
	'Hôm nay tôi muốn hỏi bạn về dự án mới.',
	'Mọi việc đã được chuẩn bị chu đáo và sẵn sàng.',
	'Hệ thống tin nhắn hoạt động nhanh chóng và an toàn.',
	'Tính năng gợi ý từ tiếp theo giúp người dùng gõ phím nhanh hơn.',
	'Cài đặt phiên bản mới nhất để trải nghiệm những tính năng hữu ích.',
	'Chúc mừng sinh nhật, chúc bạn tuổi mới ngập tràn niềm vui.',
	'Nói tiếng Việt không dấu anh em có hiểu không?',
	'Nói tiếng Việt có dấu giúp mọi người dễ đọc hơn.',
	'Anh em có hiểu ý của sếp không?',
	'Bạn có hiểu rõ nội dung thảo luận không?'
];

// Helper: match case
function matchCase(orig, repl) {
	if (orig === orig.toUpperCase()) return repl.toUpperCase();
	if (orig[0] === orig[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
	return repl;
}

// Tone placement modern (hoa -> hòa, thuy -> thủy)
function applyToneModern(baseWord, toneIdx) {
	if (toneIdx === 0) return baseWord;
	const w = baseWord.toLowerCase();
	const vList = [];
	for (let i = 0; i < w.length; i++) {
		if (VOWELS[w[i]]) vList.push({ idx: i, char: w[i] });
	}
	if (vList.length === 0) return baseWord;

	let targetIdx = vList[0].idx;
	if (vList.length === 1) {
		targetIdx = vList[0].idx;
	} else if (vList.length === 2) {
		const v1 = vList[0].char,
			v2 = vList[1].char;
		const codaExists = vList[1].idx < w.length - 1;
		if (['oa', 'oe', 'uy'].includes(v1 + v2)) {
			targetIdx = codaExists ? vList[1].idx : vList[0].idx;
		} else if (codaExists) {
			targetIdx = vList[1].idx;
		} else {
			targetIdx = vList[0].idx;
		}
	} else if (vList.length === 3) {
		targetIdx = vList[1].idx;
	}

	const chars = baseWord.split('');
	const targetChar = chars[targetIdx].toLowerCase();
	const baseVowel = CHAR_TO_TONE[targetChar] ? CHAR_TO_TONE[targetChar].base : targetChar;
	if (VOWELS[baseVowel]) {
		const rep = VOWELS[baseVowel][toneIdx];
		chars[targetIdx] = chars[targetIdx] === chars[targetIdx].toUpperCase() ? rep.toUpperCase() : rep;
	}
	return chars.join('');
}

function extractTone(word) {
	let detectedTone = 0;
	const chars = [];
	for (const c of word) {
		if (CHAR_TO_TONE[c.toLowerCase()]) {
			const { base, toneIdx } = CHAR_TO_TONE[c.toLowerCase()];
			if (toneIdx > 0) detectedTone = toneIdx;
			chars.append ? chars.append(base) : chars.push(c === c.toUpperCase() ? base.toUpperCase() : base);
		} else {
			chars.push(c);
		}
	}
	return { base: chars.join(''), tone: detectedTone };
}

function stripAccents(s) {
	if (!s) return '';
	return s
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D');
}

function isValidVietnameseSyllable(syllable) {
	if (!syllable) return true;
	const s = syllable.toLowerCase().trim();
	if (!/^[\p{L}]+$/u.test(s)) return false;

	// Syllable can have at most 1 tone mark (forbids invalid stacked tones like 'vịệc')
	let nonZeroTones = 0;
	for (const c of s) {
		if (CHAR_TO_TONE[c] && CHAR_TO_TONE[c].toneIdx > 0) {
			nonZeroTones++;
		}
	}
	if (nonZeroTones > 1) return false;

	// 1. Invalid diphthongs like 'ưô' (e.g. 'lưôn')
	if (/[ưừứửữự][ôồốổỗộ]/u.test(s)) return false;

	// 2. Before 'nh' or 'ch', vowels ă, â, ô, ơ, ư are strictly forbidden
	if (/[ăằắẳẵặâầấẩẫậôồốổỗộơờớởỡợưừứửữự](nh|ch)$/u.test(s)) return false;

	// 3. Check stop coda tone restriction (c, ch, p, t must have tone sắc or nặng)
	const { base, tone } = extractTone(s);
	for (const coda of ['ch', 'c', 'p', 't']) {
		if (base.endsWith(coda)) {
			if (tone !== 2 && tone !== 5) return false;
			break;
		}
	}
	return true;
}

const COMMON_CANDIDATES = {
	noi: 'nói',
	tieng: 'tiếng',
	viet: 'Việt',
	dau: 'dấu',
	co: 'có',
	hieu: 'hiểu',
	khong: 'không',
	dang: 'đang',
	lam: 'làm',
	viec: 'việc',
	di: 'đi',
	den: 'đến',
	ve: 'về',
	va: 'và',
	rat: 'rất',
	vui: 'vui',
	duoc: 'được',
	muon: 'muốn',
	thich: 'thích',
	phai: 'phải',
	nen: 'nên',
	chua: 'chưa',
	roi: 'rồi',
	luon: 'luôn',
	giup: 'giúp',
	nhe: 'nhé',
	se: 'sẽ',
	can: 'cần',
	dung: 'đúng',
	lan: 'lần',
	kiem: 'kiểm',
	nho: 'nhớ',
	truoc: 'trước',
	chuan: 'chuẩn',
	tra: 'trả',
	biet: 'biết',
	nghi: 'nghĩ',
	uong: 'uống',
	ngu: 'ngủ',
	chuc: 'chúc',
	mot: 'một',
	ngay: 'ngày',
	tot: 'tốt',
	lanh: 'lành',
	thanh: 'thành',
	cong: 'công',
	trua: 'trưa',
	sep: 'sếp',
	troi: 'trời',
	truong: 'trường',
	cach: 'cách',
	dep: 'đẹp',
	luc: 'lúc',
	tap: 'tập',
	khac: 'khác',
	kho: 'khó',
	duoi: 'dưới',
	tren: 'trên',
	minh: 'mình',
	cac: 'các',
	an: 'ăn',
	com: 'cơm',
	chan: 'chán',
	met: 'mệt',
	xau: 'xấu',
	vay: 'vậy',
	vi: 'vì',
	hoac: 'hoặc',
	ngoai: 'ngoài',
	nua: 'nữa',
	da: 'đã',
	ha: 'hả',
	oi: 'ơi',
	it: 'ít',
	cai: 'cái',
	vao: 'vào',
	cung: 'cũng'
};

const COLLOCATIONS_MAP = {
	ok_anh: ['ok', 'anh'],
	ok_em: ['ok', 'em'],
	ok_chi: ['ok', 'chị'],
	ok_sep: ['ok', 'sếp'],
	ok_ban: ['ok', 'bạn'],
	ok_bac: ['ok', 'bác'],
	ok_chu: ['ok', 'chú'],
	ok_thay: ['ok', 'thầy'],
	ok_nhe: ['ok', 'nhé'],
	minh_sua: ['mình', 'sửa'],
	sua_roi: ['sửa', 'rồi'],
	sua_nhe: ['sửa', 'nhé'],
	sua_xong: ['sửa', 'xong'],
	sua_lai: ['sửa', 'lại'],
	sua_code: ['sửa', 'code'],
	sua_bug: ['sửa', 'bug'],
	sua_loi: ['sửa', 'lỗi'],
	em_sua: ['em', 'sửa'],
	anh_sua: ['anh', 'sửa'],
	thay_check: ['thầy', 'check'],
	thay_chay: ['thấy', 'chạy'],
	cau_vua: ['câu', 'vừa'],
	vua_roi: ['vừa', 'rồi'],
	xem_ben: ['xem', 'bên'],
	ben_client: ['bên', 'client'],
	ben_desktop: ['bên', 'desktop'],
	chay_co: ['chạy', 'có'],
	co_khop: ['có', 'khớp'],
	khop_ben: ['khớp', 'bên'],
	oi_gioi: ['ôi', 'giời'],
	oi_troi: ['ôi', 'trời'],
	gioi_oi: ['giời', 'ơi'],
	troi_oi: ['trời', 'ơi'],
	gioi_a: ['giời', 'ạ'],
	troi_a: ['trời', 'ạ'],
	ong_gioi: ['ông', 'giời'],
	ong_troi: ['ông', 'trời'],
	nho_gioi: ['nhờ', 'giời'],
	nho_troi: ['nhờ', 'trời'],
	lay_gioi: ['lạy', 'giời'],
	lay_troi: ['lạy', 'trời'],
	chua_toi: ['chúa', 'tôi'],
	to_qua: ['to', 'quá'],
	con_luon: ['con', 'lươn'],
	thit_luon: ['thịt', 'lươn'],
	chao_luon: ['cháo', 'lươn'],
	be_thui: ['bê', 'thui'],
	thui_chot: ['thui', 'chột'],
	thoi_chot: ['thui', 'chột'],
	cung_xong: ['cũng', 'xong'],
	xong_roi: ['xong', 'rồi'],
	xong_di: ['xong', 'đi'],
	di_lam: ['đi', 'làm'],
	rat_vui: ['rất', 'vui'],
	vui_ve: ['vui', 'vẻ'],
	cac_ban: ['các', 'bạn'],
	di_ban: ['đi', 'bạn'],
	chuc_ban: ['chúc', 'bạn'],
	chao_ban: ['chào', 'bạn'],
	cho_ban: ['cho', 'bạn'],
	voi_ban: ['với', 'bạn'],
	cung_ban: ['cùng', 'bạn'],
	ban_oi: ['bạn', 'ơi'],
	ban_be: ['bạn', 'bè'],
	ban_than: ['bạn', 'thân'],
	ban_doc: ['bạn', 'đọc'],
	ban_dung: ['bạn', 'đúng'],
	ban_nhe: ['bạn', 'nhé'],
	ban_nha: ['bạn', 'nha'],
	ban_a: ['bạn', 'à'],
	ban_co: ['bạn', 'có'],
	ban_biet: ['bạn', 'biết'],
	ban_hieu: ['bạn', 'hiểu'],
	ban_muon: ['bạn', 'muốn'],
	ban_thich: ['bạn', 'thích'],
	ban_ngay: ['ban', 'ngày'],
	ban_dem: ['ban', 'đêm'],
	ban_giam_doc: ['ban', 'giám', 'đốc'],
	ban_quan_ly: ['ban', 'quản', 'lý'],
	ban_to_chuc: ['ban', 'tổ', 'chức'],
	ban_hanh: ['ban', 'hành'],
	toi_muon: ['tôi', 'muốn'],
	toi_nghi: ['tôi', 'nghĩ'],
	toi_biet: ['tôi', 'biết'],
	toi_thay: ['tôi', 'thấy'],
	toi_hieu: ['tôi', 'hiểu'],
	toi_lam: ['tôi', 'làm'],
	toi_di: ['tôi', 'đi'],
	toi_an: ['tôi', 'ăn'],
	toi_ve: ['tôi', 'về'],
	toi_o: ['tôi', 'ở'],
	toi_co: ['tôi', 'có'],
	toi_can: ['tôi', 'cần'],
	toi_da: ['tôi', 'đã'],
	toi_se: ['tôi', 'sẽ'],
	toi_dang: ['tôi', 'đang'],
	toi_cung: ['tôi', 'cũng'],
	toi_thich: ['tôi', 'thích'],
	toi_yeu: ['tôi', 'yêu'],
	toi_khong: ['tôi', 'không'],
	toi_chua: ['tôi', 'chưa'],
	buoi_toi: ['buổi', 'tối'],
	toi_nay: ['tối', 'nay'],
	toi_qua: ['tối', 'qua'],
	toi_mai: ['tối', 'mai'],
	di_an: ['đi', 'ăn'],
	an_com: ['ăn', 'cơm'],
	an_bun: ['ăn', 'bún'],
	bun_cha: ['bún', 'chả'],
	da_thit: ['da', 'thịt'],
	ben_hong: ['bên', 'hông'],
	bit_tat: ['bít', 'tất'],
	ve_nha: ['về', 'nhà'],
	di_ngu: ['đi', 'ngủ'],
	ngu_ngon: ['ngủ', 'ngon'],
	uong_nuoc: ['uống', 'nước'],
	noi_tieng: ['nói', 'tiếng'],
	tieng_viet: ['tiếng', 'Việt'],
	khong_dau: ['không', 'dấu'],
	ko_dau: ['không', 'dấu'],
	co_dau: ['có', 'dấu'],
	co_hieu: ['có', 'hiểu'],
	hieu_khong: ['hiểu', 'không'],
	hieu_ko: ['hiểu', 'không'],
	anh_em: ['anh', 'em'],
	o_dau: ['ở', 'đâu'],
	di_dau: ['đi', 'đâu'],
	bat_dau: ['bắt', 'đầu'],
	ban_dau: ['ban', 'đầu'],
	dau_tien: ['đầu', 'tiên'],
	dau_cau: ['dấu', 'câu'],
	dau_cham: ['dấu', 'chấm'],
	dau_phay: ['dấu', 'phẩy'],
	dau_hoi: ['dấu', 'hỏi'],
	dau_nga: ['dấu', 'ngã'],
	xin_chao: ['xin', 'chào'],
	com_trua: ['cơm', 'trưa'],
	an_trua: ['ăn', 'trưa'],
	ca_nha: ['cả', 'nhà'],
	voi_sep: ['với', 'sếp'],
	cam_on: ['cảm', 'ơn'],
	xin_loi: ['xin', 'lỗi'],
	chuc_mung: ['chúc', 'mừng'],
	tot_lanh: ['tốt', 'lành'],
	lam_viec: ['làm', 'việc'],
	tro_chuyen: ['trò', 'chuyện'],
	tin_nhan: ['tin', 'nhắn'],
	he_thong: ['hệ', 'thống'],
	co_the: ['có', 'thể'],
	chung_ta: ['chúng', 'ta'],
	chung_toi: ['chúng', 'tôi'],
	bay_gio: ['bây', 'giờ'],
	thoi_gian: ['thời', 'gian'],
	kiem_tra: ['kiểm', 'tra'],
	van_de: ['vấn', 'đề'],
	hop_dong: ['hợp', 'đồng'],
	tai_khoan: ['tài', 'khoản'],
	khach_hang: ['khách', 'hàng'],
	tien_do: ['tiến', 'độ'],
	bao_cao: ['báo', 'cáo'],
	thong_bao: ['thông', 'báo'],
	ung_dung: ['ứng', 'dụng'],
	giao_dien: ['giao', 'diện'],
	tai_lieu: ['tài', 'liệu'],
	dong_nghiep: ['đồng', 'nghiệp'],
	chao_luon: ['cháo', 'lươn'],
	con_luon: ['con', 'lươn'],
	thit_luon: ['thịt', 'lươn'],
	luon_leo: ['lươn', 'lẹo'],
	luon_dong: ['lươn', 'đồng'],
	bay_luon: ['bay', 'lượn'],
	luon_lo: ['lượn', 'lờ'],
	luon_quanh: ['lượn', 'quanh'],
	di_luon: ['đi', 'luôn'],
	lam_luon: ['làm', 'luôn'],
	ngay_luon: ['ngay', 'luôn'],
	xong_luon: ['xong', 'luôn'],
	luon_luon: ['luôn', 'luôn'],
	luon_tien: ['luôn', 'tiện'],
	luon_nhe: ['luôn', 'nhé'],
	suggest_luon: ['suggest', 'luôn'],
	nay_to: ['này', 'to'],
	to_qua: ['to', 'quá'],
	rat_ngon: ['rất', 'ngon'],
	anh_ay: ['anh', 'ấy'],
	// thui -> authentic 'thui'
	be_thui: ['bê', 'thui'],
	mon_be: ['món', 'bê'],
	thit_thui: ['thịt', 'thui'],
	cho_thui: ['chó', 'thui'],
	thui_rom: ['thui', 'rơm'],
	thui_chot: ['thui', 'chột'],
	thui_thui: ['thui', 'thủi'],
	mot_minh: ['một', 'mình'],
	rat_thom: ['rất', 'thơm'],
	dung_lam: ['đừng', 'làm'],
	tai_nang: ['tài', 'năng'],
	nang_tre: ['năng', 'trẻ'],
	// thui -> chat slang for 'thôi'
	vay_thui: ['vậy', 'thôi'],
	the_thui: ['thế', 'thôi'],
	nghi_lam: ['nghỉ', 'làm'],
	nghi_hoc: ['nghỉ', 'học'],
	nghi_phep: ['nghỉ', 'phép'],
	nghi_viec: ['nghỉ', 'việc'],
	nghi_trua: ['nghỉ', 'trưa'],
	nghi_ngoi: ['nghỉ', 'ngơi'],
	nghi_le: ['nghỉ', 'lễ'],
	nghi_tet: ['nghỉ', 'tết'],
	nghi_he: ['nghỉ', 'hè'],
	nghi_om: ['nghỉ', 'ốm'],
	nghi_sinh: ['nghỉ', 'sinh'],
	nghi_duong: ['nghỉ', 'dưỡng'],
	nghi_mat: ['nghỉ', 'mát'],
	xin_nghi: ['xin', 'nghỉ'],
	duoc_nghi: ['được', 'nghỉ'],
	tam_nghi: ['tạm', 'nghỉ'],
	ngay_nghi: ['ngày', 'nghỉ'],
	gio_nghi: ['giờ', 'nghỉ'],
	nha_nghi: ['nhà', 'nghỉ'],
	nghi_thui: ['nghỉ', 'thôi'],
	thui_di: ['thôi', 'đi'],
	thui_nhe: ['thôi', 'nhé'],
	thui_nha: ['thôi', 'nha'],
	thui_ma: ['thôi', 'mà'],
	di_ma: ['đi', 'mà'],
	thui_roi: ['thôi', 'rồi'],
	duoc_thui: ['được', 'thôi'],
	dung_thui: ['đúng', 'thôi'],
	xong_thui: ['xong', 'thôi'],
	ve_thui: ['về', 'thôi'],
	di_thui: ['đi', 'thôi'],
	an_thui: ['ăn', 'thôi'],
	lam_thui: ['làm', 'thôi'],
	ngu_thui: ['ngủ', 'thôi'],
	uong_thui: ['uống', 'thôi'],
	// toi -> tối (evening / night / optimal / max)
	buoi_toi: ['buổi', 'tối'],
	troi_toi: ['trời', 'tối'],
	bong_toi: ['bóng', 'tối'],
	chieu_toi: ['chiều', 'tối'],
	dem_toi: ['đêm', 'tối'],
	sang_toi: ['sáng', 'tối'],
	toi_nay: ['tối', 'nay'],
	toi_qua: ['tối', 'qua'],
	toi_mai: ['tối', 'mai'],
	toi_hom: ['tối', 'hôm'],
	an_toi: ['ăn', 'tối'],
	com_toi: ['cơm', 'tối'],
	ve_toi: ['về', 'tối'],
	luc_toi: ['lúc', 'tối'],
	toi_thoi: ['tối', 'thôi'],
	han_ta: ['hắn', 'ta'],
	nghiep_qua: ['nghiệp', 'quá'],
	toi_thui: ['tối', 'thui'],
	toi_tam: ['tối', 'tăm'],
	toi_uu: ['tối', 'ưu'],
	toi_da: ['tối', 'đa'],
	toi_thieu: ['tối', 'thiểu'],
	toi_gian: ['tối', 'giản'],
	toi_hau: ['tối', 'hậu'],
	toi_co: ['tối', 'cổ'],
	den_toi: ['đen', 'tối'],
	// toi -> tới (arrive / reach / to)
	cho_toi: ['cho', 'tới'],
	di_toi: ['đi', 'tới'],
	den_toi: ['đến', 'tới'],
	tien_toi: ['tiến', 'tới'],
	huong_toi: ['hướng', 'tới'],
	nhin_toi: ['nhìn', 'tới'],
	chay_toi: ['chạy', 'tới'],
	ghe_toi: ['ghé', 'tới'],
	tuan_toi: ['tuần', 'tới'],
	thang_toi: ['tháng', 'tới'],
	nam_toi: ['năm', 'tới'],
	lan_toi: ['lần', 'tới'],
	dan_toi: ['dẫn', 'tới'],
	mang_toi: ['mang', 'tới'],
	dua_toi: ['đưa', 'tới'],
	chuyen_toi: ['chuyển', 'tới'],
	gui_toi: ['gửi', 'tới'],
	quay_toi: ['quay', 'tới'],
	bay_toi: ['bay', 'tới'],
	nghi_toi: ['nghĩ', 'tới'],
	nhac_toi: ['nhắc', 'tới'],
	tim_toi: ['tìm', 'tòi'],
	// toi -> tội (crime / guilt / pity)
	pham_toi: ['phạm', 'tội'],
	co_toi: ['có', 'tội'],
	toi_nghiep: ['tội', 'nghiệp'],
	toi_pham: ['tội', 'phạm'],
	mac_toi: ['mắc', 'tội'],
	dac_toi: ['đắc', 'tội'],
	vo_toi: ['vô', 'tội'],
	chuoc_toi: ['chuộc', 'tội'],
	tong_toi: ['tống', 'tội'],
	tha_toi: ['tha', 'tội'],
	ket_toi: ['kết', 'tội'],
	ganh_toi: ['gánh', 'tội'],
	nhan_toi: ['nhận', 'tội'],
	biet_toi: ['biết', 'tội'],
	ta_toi: ['tạ', 'tội'],
	chiu_toi: ['chịu', 'tội'],
	dinh_toi: ['định', 'tội'],
	luan_toi: ['luận', 'tội'],
	toi_loi: ['tội', 'lỗi'],
	toi_do: ['tội', 'đồ'],
	toi_va: ['tội', 'vạ'],
	mang_toi: ['mang', 'tội'],
	phat_toi: ['phạt', 'tội'],
	toi_ac: ['tội', 'ác'],
	toi_tinh: ['tội', 'tình'],
	toi_trang: ['tội', 'trạng'],
	// toi -> authentic 'toi' (dead / ruined)
	chet_toi: ['chết', 'toi'],
	toi_mang: ['toi', 'mạng'],
	toi_doi: ['toi', 'đời'],
	toi_cong: ['toi', 'công'],
	toi_com: ['toi', 'cơm'],
	dich_toi: ['dịch', 'toi'],
	ga_toi: ['gà', 'toi'],
	mat_toi: ['mất', 'toi'],
	// toi -> tôi (pronoun)
	toi_muon: ['tôi', 'muốn'],
	toi_nghi: ['tôi', 'nghĩ'],
	toi_biet: ['tôi', 'biết'],
	toi_thay: ['tôi', 'thấy'],
	toi_hieu: ['tôi', 'hiểu'],
	toi_lam: ['tôi', 'làm'],
	toi_di: ['tôi', 'đi'],
	toi_an: ['tôi', 'ăn'],
	toi_ve: ['tôi', 'về'],
	toi_o: ['tôi', 'ở'],
	toi_xin: ['tôi', 'xin'],
	toi_co: ['tôi', 'có'],
	toi_can: ['tôi', 'cần'],
	toi_da: ['tôi', 'đã'],
	toi_se: ['tôi', 'sẽ'],
	toi_dang: ['tôi', 'đang'],
	toi_cung: ['tôi', 'cũng'],
	toi_thich: ['tôi', 'thích'],
	toi_yeu: ['tôi', 'yêu'],
	toi_khong: ['tôi', 'không'],
	toi_chua: ['tôi', 'chưa'],
	chung_toi: ['chúng', 'tôi'],
	cua_toi: ['của', 'tôi'],
	voi_toi: ['với', 'tôi'],
	ban_viec: ['bận', 'việc'],
	viec_ti: ['việc', 'tí'],
	viec_chut: ['việc', 'chút'],
	viec_xiu: ['việc', 'xíu'],
	ban_ti: ['bận', 'tí'],
	ban_chut: ['bận', 'chút'],
	ban_xiu: ['bận', 'xíu'],
	ban_dot: ['bận', 'đột'],
	cac_chu: ['các', 'chú'],
	chu_tu: ['chú', 'tự'],
	tu_daily: ['tự', 'daily'],
	daily_nhe: ['daily', 'nhé'],
	can_dung: ['cần', 'dùng'],
	dung_unikey: ['dùng', 'unikey'],
	dung_de: ['dùng', 'để'],
	dung_cho: ['dùng', 'cho'],
	dung_duoc: ['dùng', 'được'],
	dung_thu: ['dùng', 'thử'],
	dung_tam: ['dùng', 'tạm'],
	dung_nua: ['dùng', 'nữa'],
	dang_dung: ['đang', 'dùng'],
	chua_dung: ['chưa', 'dùng'],
	se_dung: ['sẽ', 'dùng'],
	muon_dung: ['muốn', 'dùng'],
	cach_dung: ['cách', 'dùng'],
	de_dung: ['dễ', 'dùng'],
	kho_dung: ['khó', 'dùng'],
	tap_dung: ['tập', 'dùng'],
	thich_dung: ['thích', 'dùng'],
	quen_dung: ['quen', 'dùng'],
	it_dung: ['ít', 'dùng'],
	hay_dung: ['hay', 'dùng'],
	tieng_viet: ['tiếng', 'Việt'],
	de_anh: ['để', 'anh'],
	mong_cai: ['mong', 'cái']
};

const TRIGRAM_COLLOCATIONS_MAP = {
	minh_sua_roi: ['mình', 'sửa', 'rồi'],
	sua_roi_nhe: ['sửa', 'rồi', 'nhé'],
	em_sua_roi: ['em', 'sửa', 'rồi'],
	anh_sua_roi: ['anh', 'sửa', 'rồi'],
	sua_xong_roi: ['sửa', 'xong', 'rồi'],
	sua_lai_roi: ['sửa', 'lại', 'rồi'],
	da_sua_roi: ['đã', 'sửa', 'rồi'],
	cau_vua_roi: ['câu', 'vừa', 'rồi'],
	thay_chay_co: ['thấy', 'chạy', 'có'],
	chay_co_khop: ['chạy', 'có', 'khớp'],
	co_khop_ben: ['có', 'khớp', 'bên'],
	khop_ben_desktop: ['khớp', 'bên', 'desktop'],
	xem_ben_client: ['xem', 'bên', 'client'],
	ben_client_example: ['bên', 'client', 'example'],
	khong_can_dung: ['không', 'cần', 'dùng'],
	can_dung_unikey: ['cần', 'dùng', 'unikey'],
	can_dung_nua: ['cần', 'dùng', 'nữa'],
	chua_can_dung: ['chưa', 'cần', 'dùng'],
	dung_unikey_nua: ['dùng', 'unikey', 'nữa'],
	khong_dung_unikey: ['không', 'dùng', 'unikey'],
	de_anh_khong: ['để', 'anh', 'không'],
	dau_tieng_viet: ['dấu', 'tiếng', 'Việt'],
	them_dau_tieng: ['thêm', 'dấu', 'tiếng'],
	hom_nay_anh: ['hôm', 'nay', 'anh'],
	sang_nay_anh: ['sáng', 'nay', 'anh'],
	chieu_nay_anh: ['chiều', 'nay', 'anh'],
	toi_nay_anh: ['tối', 'nay', 'anh'],
	trua_nay_anh: ['trưa', 'nay', 'anh'],
	nay_anh_ban: ['nay', 'anh', 'bận'],
	anh_ban_viec: ['anh', 'bận', 'việc'],
	chi_ban_viec: ['chị', 'bận', 'việc'],
	em_ban_viec: ['em', 'bận', 'việc'],
	minh_ban_viec: ['mình', 'bận', 'việc'],
	sep_ban_viec: ['sếp', 'bận', 'việc'],
	ban_viec_ti: ['bận', 'việc', 'tí'],
	ban_viec_chut: ['bận', 'việc', 'chút'],
	ban_viec_xiu: ['bận', 'việc', 'xíu'],
	ban_viec_nhe: ['bận', 'việc', 'nhé'],
	co_viec_ban: ['có', 'việc', 'bận'],
	cac_chu_tu: ['các', 'chú', 'tự'],
	chu_tu_daily: ['chú', 'tự', 'daily'],
	tu_daily_nhe: ['tự', 'daily', 'nhé'],
	cu_tu_daily: ['cứ', 'tự', 'daily'],
	oi_gioi_oi: ['ôi', 'giời', 'ơi'],
	oi_troi_oi: ['ôi', 'trời', 'ơi'],
	gioi_oi_dat: ['giời', 'ơi', 'đất'],
	troi_oi_dat: ['trời', 'ơi', 'đất'],
	oi_dat_hoi: ['ơi', 'đất', 'hỡi'],
	lay_chua_toi: ['lạy', 'chúa', 'tôi'],
	lay_ong_gioi: ['lạy', 'ông', 'giời'],
	lay_ong_troi: ['lạy', 'ông', 'trời'],
	dung_lam_thui: ['đừng', 'làm', 'thui'],
	thui_chot_tai: ['thui', 'chột', 'tài'],
	tai_nang_tre: ['tài', 'năng', 'trẻ'],
	an_com_xong: ['ăn', 'cơm', 'xong'],
	xong_di_luon: ['xong', 'đi', 'luôn'],
	cho_toi_khi: ['cho', 'tới', 'khi'],
	cho_toi_nay: ['cho', 'tới', 'nay'],
	cho_toi_gio: ['cho', 'tới', 'giờ'],
	cho_toi_biet: ['cho', 'tôi', 'biết'],
	cho_toi_xin: ['cho', 'tôi', 'xin'],
	cho_toi_hoi: ['cho', 'tôi', 'hỏi'],
	cho_toi_xem: ['cho', 'tôi', 'xem'],
	tinh_cho_toi: ['tính', 'cho', 'tới'],
	anh_huong_toi: ['ảnh', 'hưởng', 'tới'],
	ban_than_toi: ['bản', 'thân', 'tôi'],
	doi_voi_toi: ['đối', 'với', 'tôi'],
	lam_thui_chot: ['làm', 'thui', 'chột'],
	anh_nghi_lam: ['anh', 'nghỉ', 'làm'],
	em_nghi_lam: ['em', 'nghỉ', 'làm'],
	toi_nghi_lam: ['tôi', 'nghỉ', 'làm'],
	ban_nghi_lam: ['bạn', 'nghỉ', 'làm'],
	mai_nghi_lam: ['mai', 'nghỉ', 'làm'],
	nghi_lam_nhe: ['nghỉ', 'làm', 'nhé'],
	nghi_lam_nha: ['nghỉ', 'làm', 'nha'],
	nghi_lam_roi: ['nghỉ', 'làm', 'rồi'],
	nghi_lam_di: ['nghỉ', 'làm', 'đi'],
	mai_anh_nghi: ['mai', 'anh', 'nghỉ'],
	mai_em_nghi: ['mai', 'em', 'nghỉ'],
	nay_anh_nghi: ['nay', 'anh', 'nghỉ'],
	nay_em_nghi: ['nay', 'em', 'nghỉ'],
	sang_mai_nghi: ['sáng', 'mai', 'nghỉ'],
	ngay_mai_nghi: ['ngày', 'mai', 'nghỉ'],
	hom_nay_nghi: ['hôm', 'nay', 'nghỉ'],
	anh_nghi_nhe: ['anh', 'nghỉ', 'nhé'],
	em_nghi_nhe: ['em', 'nghỉ', 'nhé'],
	anh_nghi_di: ['anh', 'nghỉ', 'đi'],
	em_nghi_di: ['em', 'nghỉ', 'đi'],
	xin_nghi_lam: ['xin', 'nghỉ', 'làm'],
	xin_nghi_phep: ['xin', 'nghỉ', 'phép'],
	xin_nghi_hoc: ['xin', 'nghỉ', 'học'],
	duoc_nghi_lam: ['được', 'nghỉ', 'làm'],
	nghi_giai_lao: ['nghỉ', 'giải', 'lao'],
	anh_nghi_ngoi: ['anh', 'nghỉ', 'ngơi'],
	em_nghi_ngoi: ['em', 'nghỉ', 'ngơi'],
	anh_nghi_la: ['anh', 'nghĩ', 'là'],
	anh_nghi_sao: ['anh', 'nghĩ', 'sao'],
	anh_nghi_gi: ['anh', 'nghĩ', 'gì'],
	anh_nghi_the: ['anh', 'nghĩ', 'thế'],
	anh_nghi_rang: ['anh', 'nghĩ', 'rằng'],
	em_nghi_la: ['em', 'nghĩ', 'là'],
	em_nghi_sao: ['em', 'nghĩ', 'sao'],
	em_nghi_gi: ['em', 'nghĩ', 'gì'],
	toi_nghi_la: ['tôi', 'nghĩ', 'là'],
	toi_nghi_rang: ['tôi', 'nghĩ', 'rằng']
};

function restoreDiacritics(text) {
	if (isPredominantlyEnglishSentence(text)) return { text, edits: [] };
	const tokens = text.match(/\p{L}+|[^\p{L}]+/gu) || [];
	const wordIdxs = [];
	for (let i = 0; i < tokens.length; i++) {
		if (/\p{L}/u.test(tokens[i]) && !isForeignOrTechWord(tokens[i])) {
			wordIdxs.push(i);
		}
	}

	const restored = [...tokens];
	const edits = [];
	const matchedIdxs = new Set();

	// 1a. Trigram collocations pass
	for (let k = 0; k < wordIdxs.length - 2; k++) {
		const i1 = wordIdxs[k],
			i2 = wordIdxs[k + 1],
			i3 = wordIdxs[k + 2];
		const s1 = stripAccents(tokens[i1]).toLowerCase();
		const s2 = stripAccents(tokens[i2]).toLowerCase();
		const s3 = stripAccents(tokens[i3]).toLowerCase();
		const key = s1 + '_' + s2 + '_' + s3;
		if (TRIGRAM_COLLOCATIONS_MAP[key]) {
			restored[i1] = matchCase(tokens[i1], TRIGRAM_COLLOCATIONS_MAP[key][0]);
			restored[i2] = matchCase(tokens[i2], TRIGRAM_COLLOCATIONS_MAP[key][1]);
			restored[i3] = matchCase(tokens[i3], TRIGRAM_COLLOCATIONS_MAP[key][2]);
			matchedIdxs.add(i1);
			matchedIdxs.add(i2);
			matchedIdxs.add(i3);
		}
	}

	// 1b. Bigram collocations pass
	for (let k = 0; k < wordIdxs.length - 1; k++) {
		const i1 = wordIdxs[k],
			i2 = wordIdxs[k + 1];
		const s1 = stripAccents(tokens[i1]).toLowerCase();
		const s2 = stripAccents(tokens[i2]).toLowerCase();
		const key = s1 + '_' + s2;
		if (COLLOCATIONS_MAP[key]) {
			if (!matchedIdxs.has(i1)) {
				restored[i1] = matchCase(tokens[i1], COLLOCATIONS_MAP[key][0]);
				matchedIdxs.add(i1);
			}
			if (!matchedIdxs.has(i2)) {
				restored[i2] = matchCase(tokens[i2], COLLOCATIONS_MAP[key][1]);
				matchedIdxs.add(i2);
			}
		}
	}

	// 2. [REMOVED] Naive single-word "add tone" pass removed to prevent false positives like oi->ơi, toi->tôi

	// 3. Generate fine-grained word and collocation edits
	let k = 0;
	while (k < wordIdxs.length) {
		const idx = wordIdxs[k];
		if (k < wordIdxs.length - 2) {
			const next1 = wordIdxs[k + 1];
			const next2 = wordIdxs[k + 2];
			const s1 = stripAccents(tokens[idx]).toLowerCase();
			const s2 = stripAccents(tokens[next1]).toLowerCase();
			const s3 = stripAccents(tokens[next2]).toLowerCase();
			const triKey = s1 + '_' + s2 + '_' + s3;
			if (
				TRIGRAM_COLLOCATIONS_MAP[triKey] &&
				(tokens[idx] !== restored[idx] || tokens[next1] !== restored[next1] || tokens[next2] !== restored[next2])
			) {
				const origColloc = `${tokens[idx]} ${tokens[next1]} ${tokens[next2]}`;
				const newColloc = `${restored[idx]} ${restored[next1]} ${restored[next2]}`;
				edits.push({
					original: origColloc,
					replacement: newColloc,
					reason: `Khôi phục dấu theo cụm từ ('${origColloc}' -> '${newColloc}')`
				});
				k += 3;
				continue;
			}
		}
		if (k < wordIdxs.length - 1) {
			const nextIdx = wordIdxs[k + 1];
			const s1 = stripAccents(tokens[idx]).toLowerCase();
			const s2 = stripAccents(tokens[nextIdx]).toLowerCase();
			const key = s1 + '_' + s2;
			if (COLLOCATIONS_MAP[key] && (tokens[idx] !== restored[idx] || tokens[nextIdx] !== restored[nextIdx])) {
				const origColloc = `${tokens[idx]} ${tokens[nextIdx]}`;
				const newColloc = `${restored[idx]} ${restored[nextIdx]}`;
				edits.push({
					original: origColloc,
					replacement: newColloc,
					reason: `Khôi phục dấu theo cụm từ ('${origColloc}' -> '${newColloc}')`
				});
				k += 2;
				continue;
			}
		}
		if (tokens[idx] !== restored[idx]) {
			edits.push({
				original: tokens[idx],
				replacement: restored[idx],
				reason: `Thêm dấu tiếng Việt ('${tokens[idx]}' -> '${restored[idx]}')`
			});
		}
		k++;
	}

	return { text: restored.join(''), edits };
}

// 5. Client Trie for next-word suggestion
class ClientWordTrie {
	bigrams: {};
	trigrams: {};
	unigrams: {};
	wordsList: never[];
	constructor() {
		this.bigrams = {};
		this.trigrams = {};
		this.unigrams = {};
		this.wordsList = [];
		this.initDefaultCorpus();
	}

	initDefaultCorpus() {
		DEFAULT_CORPUS.forEach((sentence) => {
			const words = sentence.match(/\p{L}+/gu) || [];
			for (let i = 0; i < words.length; i++) {
				const w = words[i].toLowerCase();
				this.unigrams[w] = (this.unigrams[w] || 0) + 1;
				if (!this.wordsList.includes(w)) this.wordsList.push(w);

				if (i < words.length - 1) {
					const nextW = words[i + 1].toLowerCase();
					if (!this.bigrams[w]) this.bigrams[w] = {};
					this.bigrams[w][nextW] = (this.bigrams[w][nextW] || 0) + 1;
				}

				if (i < words.length - 2) {
					const key = w + '_' + words[i + 1].toLowerCase();
					const thirdW = words[i + 2].toLowerCase();
					if (!this.trigrams[key]) this.trigrams[key] = {};
					this.trigrams[key][thirdW] = (this.trigrams[key][thirdW] || 0) + 1;
				}
			}
		});
	}

	completePrefix(prefix, topK = 5) {
		const p = prefix.toLowerCase();
		const matched = this.wordsList.filter((w) => w.startsWith(p));
		matched.sort((a, b) => (this.unigrams[b] || 0) - (this.unigrams[a] || 0));
		return matched.slice(0, topK).map((w) => ({ word: w, type: 'completion', prob: 0.8 }));
	}

	predictNext(contextWords, topK = 5) {
		if (!contextWords || contextWords.length === 0) {
			return Object.keys(this.unigrams)
				.slice(0, topK)
				.map((w) => ({ word: w, type: 'next_word', prob: 0.2 }));
		}
		const clean = contextWords.map((w) => w.toLowerCase());
		if (clean.length >= 2) {
			const key = clean[clean.length - 2] + '_' + clean[clean.length - 1];
			if (this.trigrams[key]) {
				const cands = Object.entries(this.trigrams[key]).sort((a, b) => b[1] - a[1]);
				return cands.slice(0, topK).map(([w]) => ({ word: w, type: 'next_word', prob: 0.7 }));
			}
		}
		const lastWord = clean[clean.length - 1];
		if (this.bigrams[lastWord]) {
			const cands = Object.entries(this.bigrams[lastWord]).sort((a, b) => b[1] - a[1]);
			return cands.slice(0, topK).map(([w]) => ({ word: w, type: 'next_word', prob: 0.5 }));
		}
		return Object.keys(this.unigrams)
			.slice(0, topK)
			.map((w) => ({ word: w, type: 'next_word', prob: 0.1 }));
	}
}

// 6. Master Client Class
export class MezonGrammarClient {
	trie: ClientWordTrie;
	modelSession: null;
	modelLoaded: boolean;
	accentSession: null;
	accentModelLoaded: boolean;
	ort: null;
	_idToToken: null;
	static PRONOUN_TEMPLATES: any;
	static DEFAULT_LEAVE_REPLIES: any;
	static DEFAULT_HEALTH_REPLIES: any;
	static DEFAULT_MEAL_REPLIES: any;
	static ACTION_ALIASES: any;
	static TINYLM_VOCAB: {};
	_intentCache: any;
	static INTENT_LABELS: any;
	static ACTION_DESCRIPTIONS: any;
	static ACCENT_VOWEL_VARIANTS: any;
	static ACCENT_CHAR_TO_ID: any;
	static RESPONSE_ACTIONS: string[];
	static LEGACY_TO_ACTION: {
		general: string;
		greeting: string;
		thanks: string;
		apology: string;
		question: string;
		task_or_update: string;
		leave_or_absence: string;
		praise: string;
		other: string;
		yes_no_question: string;
		health_inquiry: string;
		meal_or_social_invite: string;
		reply_general: string;
		reply_greeting: string;
		reply_thanks: string;
		reply_apology: string;
		reply_question: string;
		reply_task_ack: string;
		reply_task_accept: string;
		reply_leave_ack: string;
		reply_praise: string;
		reply_none: string;
		reply_confirm_yes: string;
		reply_health: string;
		reply_meal_social: string;
	};
	static DEFAULT_SPEAKER_FOR_ADDRESSEE: {
		anh: string;
		chị: string;
		sếp: string;
		thầy: string;
		bác: string;
		chú: string;
		cô: string;
		ông: string;
		bà: string;
		cháu: string;
		em: string;
		cậu: string;
		bạn: string;
		mình: string;
		'cả nhà': string;
	};
	static renderDynamicTemplate: (template: any, speaker: any, addressee: any) => string;
	static DYNAMIC_ACTION_TEMPLATES: {
		action_health_ack: string[];
		action_meal_social: string[];
		action_leave_ack: string[];
		action_task_accept: string[];
		action_confirm_yes: string[];
		action_thanks_reply: string[];
		action_apology_forgive: string[];
		action_greeting_reply: string[];
		action_praise_receive: string[];
		action_question_inquiry: string[];
		action_general_ack: string[];
		action_no_reply_needed: never[];
	};
	static SUPPORTED_PRONOUNS: string[];
	static PRONOUN_ALIASES: {
		anh: string;
		a: string;
		'anh trai': string;
		chị: string;
		chi: string;
		c: string;
		'chị gái': string;
		em: string;
		e: string;
		'em út': string;
		cháu: string;
		chau: string;
		'cháu gái': string;
		'cháu trai': string;
		sếp: string;
		sep: string;
		boss: string;
		leader: string;
		cậu: string;
		cau: string;
		tớ: string;
		to: string;
		ông: string;
		ong: string;
		bà: string;
		ba: string;
		bác: string;
		bac: string;
		chú: string;
		chu: string;
		cô: string;
		co: string;
		thầy: string;
		thay: string;
		bạn: string;
		ban: string;
		mình: string;
		minh: string;
		'cả nhà': string;
		'ca nha': string;
		'ca-nha': string;
		'mọi người': string;
		'moi nguoi': string;
		mng: string;
		mn: string;
		team: string;
		'anh em': string;
	};
	constructor() {
		this.trie = new ClientWordTrie();
		this.modelSession = null;
		this.modelLoaded = false;
		this.accentSession = null;
		this.accentModelLoaded = false;
		this.ort = null;
		this._idToToken = null;
	}

	correct(text) {
		if (!text || !text.trim()) {
			return { original: text, corrected: text, edits: [], hasErrors: false };
		}

		const edits = [];
		let current = text;

		// A. Spacing around punctuation
		const links: string[] = [];
		const protectedParts: string[] = [];

		current = current.replace(/<(\w+)\b[^>]*>.*?<\/\1\s*>|<[^>]*>|&nbsp;/g, (match) => {
			protectedParts.push(match);
			return `ENTITIES${protectedParts.length - 1}END`;
		});
		const puncCleaned = current
			.replace(/https?:\/\/[^\s)]+|www\.[^\s)]+/gi, (link) => {
				links.push(link);
				return `LINKPLACEHOLDER${links.length - 1}END`;
			})
			.replace(/\s+([,.\?!:;\]\)\}])/g, '$1')
			.replace(/([,.\?!:;])([^\s0-9,.\?!:;"'\]\)\}])/g, '$1 $2')
			.replace(/[ \t]+/g, ' ')
			.replace(/LINKPLACEHOLDER(\d+)END/g, (_, index) => links[Number(index)]);
		if (puncCleaned !== current) {
			edits.push({ original: current, replacement: puncCleaned, reason: 'Chuẩn hóa khoảng trắng dấu câu' });
			current = puncCleaned;
		}

		if (isPredominantlyEnglishSentence(puncCleaned)) {
			current = current.replace(/https?:\/\/[^\s)]+|www\.[^\s)]+|(^|[.?!]\s+)(\p{L})/giu, (m, prefix, char) =>
				/^https?:\/\/|^www\./i.test(m) ? m : prefix + char.toUpperCase()
			);
			return {
				original: text,
				corrected: current.trim(),
				edits: edits,
				hasErrors: current.trim() !== text.trim()
			};
		}

		// B. Multi-word phrases & confusables (sorted by descending length)
		const sortedPhrases = getSortedPhrases();
		for (const [wrong, right] of sortedPhrases) {
			const escaped = wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp('(?<![\\p{L}\\p{N}])' + escaped + '(?![\\p{L}\\p{N}])', 'gui');
			if (regex.test(current)) {
				current = current.replace(regex, (match) => {
					const rep = matchCase(match, right);
					edits.push({ original: match, replacement: rep, reason: 'Sửa chính tả/từ dễ lẫn' });
					return rep;
				});
			}
		}

		// C1. Multi-word teencode normalization
		for (const [phrase, replacement] of MULTI_WORD_TEENCODE_JS) {
			const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp('(?<![\\p{L}\\p{N}])' + escaped + '(?![\\p{L}\\p{N}])', 'gui');
			if (regex.test(current)) {
				current = current.replace(regex, (match) => {
					const rep = matchCase(match, replacement);
					edits.push({ original: match, replacement: rep, reason: 'Thay thế từ viết tắt/teencode' });
					return rep;
				});
			}
		}

		// C2. Single-word teencode normalization (100% priority for unique teencode)
		current = current.replace(/\b\p{L}+\b/gu, (token) => {
			const lower = token.toLowerCase();
			if (TEENCODE_MAP[lower]) {
				const rep = matchCase(token, TEENCODE_MAP[lower]);
				edits.push({ original: token, replacement: rep, reason: 'Thay thế từ viết tắt/teencode' });
				return rep;
			}
			if (isForeignOrTechWord(token)) return token;
			return token;
		});

		// C3. Collocation-based diacritic restoration (Multi-word collocations only, no naive single-word tone adding)
		const { text: restored, edits: diacriticEdits } = restoreDiacritics(current);
		if (restored !== current) {
			edits.push(...diacriticEdits);
			current = restored;
		}

		// D. Modern tone placement
		current = current.replace(/\b\p{L}+\b/gu, (token) => {
			const { base, tone } = extractTone(token);
			if (tone > 0) {
				const modern = applyToneModern(base, tone);
				if (modern !== token) {
					edits.push({ original: token, replacement: modern, reason: 'Chuẩn hóa vị trí dấu thanh' });
					return modern;
				}
			}
			return token;
		});

		// E. Capitalization
		current = current.replace(/https?:\/\/[^\s)]+|www\.[^\s)]+|(^|[.?!]\s+)(\p{L})/giu, (m, prefix, char) =>
			/^https?:\/\/|^www\./i.test(m) ? m : prefix + char.toUpperCase()
		);
		current = current.replace(/ENTITIES(\d+)END/g, (_, index) => protectedParts[Number(index)]);
		return {
			original: text,
			corrected: current.trim(),
			edits: edits,
			hasErrors: current.trim() !== text.trim()
		};
	}

	suggest(text, topK = 5) {
		if (!text) return this.trie.predictNext([], topK);
		const endsWithSpace = /\s$/.test(text);
		const endsWithTerminalPunct = /[.?!]$/.test(text.trim());

		// 1. If sentence ends with terminal punctuation and no trailing space, suggestion is complete
		if (endsWithTerminalPunct && !endsWithSpace) {
			return [];
		}

		// 2. In-progress word typing: Autocomplete prefix mode
		const endsWithLetter = /[\p{L}\p{M}]$/u.test(text);
		const words = text.match(/\p{L}+/gu) || [];
		if (endsWithLetter && words.length > 0) {
			const prefix = words[words.length - 1];
			const completions = this.trie.completePrefix(prefix, topK + 2);
			const filtered = completions.filter((c) => c.word.toLowerCase() !== prefix.toLowerCase());
			if (filtered.length > 0) {
				return filtered.slice(0, topK);
			}
			if (words.length === 1 && completions.length > 0) {
				return completions.slice(0, topK);
			}
			// Word is already a complete word: fall through to next-word prediction
		}

		// 3. Next word prediction mode (after space or clause punctuation)
		return this.trie.predictNext(words.slice(-3), topK);
	}

	detectPronounContext(text) {
		return MezonGrammarClient.extractTargetPronoun(text);
	}
	static extractTargetPronoun(text: any) {
		throw new Error('Method not implemented.');
	}

	detectPronounCandidates(text) {
		return MezonGrammarClient.extractPronounCandidates(text);
	}
	static extractPronounCandidates(text: any) {
		throw new Error('Method not implemented.');
	}

	suggestQuickReplies(previousMessage, topK = 4, pronoun = null, overrideIntent = null, confidence = null, minConfidence = 0.8, speaker = null) {
		// Only show suggest if confidence/prob >= minConfidence (default 80%)
		if (confidence !== null && confidence !== undefined && confidence < minConfidence) {
			return [];
		}

		// Handle argument overloading: suggestQuickReplies(msg, pronoun, topK) or suggestQuickReplies(msg, topK)
		if (typeof topK === 'string') {
			const temp = topK;
			topK = typeof pronoun === 'number' ? pronoun : 4;
			pronoun = temp;
		}

		let role = MezonGrammarClient.normalizePronoun(pronoun);
		if (!role) {
			role = MezonGrammarClient.extractTargetPronoun(previousMessage);
		}

		if (!speaker && previousMessage && previousMessage.trim()) {
			const pair = MezonGrammarClient.resolvePronounPair(previousMessage, role, null);
			if (pair && pair.speaker) {
				speaker = pair.speaker;
			}
		}

		if (!previousMessage || !previousMessage.trim()) {
			if (speaker !== null && speaker !== undefined) {
				return MezonGrammarClient.generateDynamicReplies('action_general_ack', speaker, role, topK);
			}
			const templates = MezonGrammarClient.PRONOUN_TEMPLATES[role] || MezonGrammarClient.PRONOUN_TEMPLATES['bạn'];
			return (templates.general || ['OK bạn.']).slice(0, topK);
		}

		const clean = previousMessage
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

		let intent = overrideIntent;
		if (!intent) {
			// Intent detection heuristics (used as fast synchronous fallback)
			const isOther =
				/^(https?:\/\/|git\s+|npm\s+|curl\s+|docker\s+|error:|select\s+\*|const\s+|let\s+|var\s+)\b/i.test(previousMessage.trim()) ||
				/^(thông báo:|thong bao:)/i.test(previousMessage.trim()) ||
				/^(so tai khoan|ma otp|so dien thoai|cccd)\b/i.test(clean) ||
				/^(\d+[\s,.\d]*|\.\.\.|\?\?\?|[a-z0-9_./-]{30,})$/i.test(clean);
			const isLeaveOrAbsence =
				/\b(nghi lam|nghi hoc|nghi phep|nghi viec|nghi trua|nghi ngoi|nghi le|nghi tet|nghi he|nghi om|xin nghi|tam nghi|ngay nghi|vang mat|di muon|den muon|ban viec|co viec ban|nghi nhe|nghi nha|ve som|tu daily|daily nhe|tu hop|tu sync|ban xiu|ban ti|ban chut|ban dot xuat)\b/.test(
					clean
				);
			const isYesNoQuestion =
				/\b(khong|ko|k|chua|chx|duoc khong|duoc ko|duoc k|phai khong|phai ko|dung khong|dung ko|on khong|ok khong|ranh khong|ban khong|xong chua)\b/.test(
					clean
				) ||
				/\b(co .* khong|co .* chua|di .* khong|an .* chua|duoc .* khong|co the .* khong)\b/.test(clean) ||
				(/\?/.test(previousMessage) &&
					!/\b(the nao|sao roi|may gio|khi nao|bao gio|o dau|tai sao|vi sao|nhu the nao|lam sao|cai gi)\b/.test(clean));
			const isTaskOrUpdate =
				!isYesNoQuestion &&
				(/\b(add|xong|roi|luon|giup|check|test|deploy|gui|cap nhat|update|fix|sua|cung xong)\b/.test(clean) ||
					(/\blam\b/.test(clean) && !isLeaveOrAbsence));
			const isQuestion =
				/\b(the nao|sao roi|may gio|khi nao|bao gio|o dau|tai sao|vi sao|nhu the nao|lam sao|cai gi)\b/.test(clean) ||
				(/\?/.test(previousMessage) && !isYesNoQuestion);
			const isThanks = /\b(cam on|tks|tk|thank|thanks|cmon|biet on)\b/.test(clean);
			const isApology = /\b(xin loi|sorry|sry|phiền|phien)\b/.test(clean);
			const isGreeting = /^(hi|hello|alo|chao|xin chao)\b/.test(clean);
			const isPraise = /\b(tuyet voi|qua da|hay qua|dinh|good|ok roi|ngon|tuyet|xuat sac)\b/.test(clean);
			const isMeal = /\b(an com|com trua|an trua|an toi|di an|ca phe|an sang)\b/.test(clean);

			intent = 'general';
			if (isOther) intent = 'other';
			else if (isThanks) intent = 'thanks';
			else if (isApology) intent = 'apology';
			else if (isLeaveOrAbsence) intent = 'leave_or_absence';
			else if (isMeal) intent = 'action_meal_social';
			else if (isYesNoQuestion) intent = 'yes_no_question';
			else if (isQuestion) intent = 'question';
			else if (isTaskOrUpdate) intent = 'task_or_update';
			else if (isGreeting) intent = 'greeting';
			else if (isPraise) intent = 'praise';
		}

		if (intent === 'action_no_reply_needed' || intent === 'reply_none' || intent === 'other') {
			return [];
		}

		let replies;
		if (speaker !== null && speaker !== undefined) {
			replies = MezonGrammarClient.generateDynamicReplies(intent, speaker, role, topK * 2);
		} else if (intent === 'action_leave_ack' || intent === 'leave_or_absence') {
			replies = [...(MezonGrammarClient.DEFAULT_LEAVE_REPLIES[role] || MezonGrammarClient.DEFAULT_LEAVE_REPLIES['bạn'])];
		} else if (intent === 'action_health_ack' || intent === 'health_inquiry') {
			replies = [...(MezonGrammarClient.DEFAULT_HEALTH_REPLIES[role] || MezonGrammarClient.DEFAULT_HEALTH_REPLIES['bạn'])];
		} else if (intent === 'action_meal_social' || intent === 'meal_or_social_invite') {
			replies = [...(MezonGrammarClient.DEFAULT_MEAL_REPLIES[role] || MezonGrammarClient.DEFAULT_MEAL_REPLIES['bạn'])];
		} else {
			const templates = MezonGrammarClient.PRONOUN_TEMPLATES[role] || MezonGrammarClient.PRONOUN_TEMPLATES['bạn'];
			const legacyKey = (MezonGrammarClient.ACTION_ALIASES && MezonGrammarClient.ACTION_ALIASES[intent]) || intent;
			replies = [...(templates[intent] || templates[legacyKey] || templates.general || ['OK bạn.'])];
		}

		// Contextual augmentation
		if ((intent === 'action_task_accept' || intent === 'task_or_update') && /\b(add|test|code|fix|bug|deploy|pr|commit)\b/.test(clean)) {
			if (role === 'anh' && !replies.includes('Để em add và test luôn.')) {
				replies.splice(2, 0, 'Để em add và test luôn.');
			} else if (role === 'chị' && !replies.includes('Để em add và test luôn chị nhé.')) {
				replies.splice(2, 0, 'Để em add và test luôn chị nhé.');
			}
		}
		if (
			(intent === 'action_meal_social' ||
				intent === 'meal_or_social_invite' ||
				intent === 'action_confirm_yes' ||
				intent === 'yes_no_question') &&
			/\b(an cuoi|dam cuoi|tiec cuoi)\b/.test(clean)
		) {
			const weddingMap = {
				anh: 'Có chứ anh, mai em đi.',
				chị: 'Có chứ chị, mai em đi.',
				em: 'Có chứ em, mai anh đi.',
				sếp: 'Dạ có sếp, mai em đi ạ.',
				cậu: 'Có chứ cậu, mai tớ đi.',
				'cả nhà': 'Có chứ cả nhà, mai mình đi.'
			};
			let weddingReply = weddingMap[role];
			if (!weddingReply && role === 'chú' && speaker === 'anh') {
				weddingReply = 'Có chứ chú, mai anh đi.';
			}
			if (!weddingReply) weddingReply = 'Có chứ bạn, mai mình đi.';
			if (!replies.includes(weddingReply)) {
				replies.unshift(weddingReply);
			}
		} else if (
			(intent === 'action_health_ack' ||
				intent === 'health_inquiry' ||
				intent === 'action_confirm_yes' ||
				intent === 'yes_no_question' ||
				intent === 'action_question_inquiry' ||
				intent === 'question' ||
				intent === 'action_greeting_reply' ||
				intent === 'greeting' ||
				overrideIntent === 'action_health_ack' ||
				overrideIntent === 'health_inquiry' ||
				overrideIntent === 'action_confirm_yes' ||
				overrideIntent === 'yes_no_question' ||
				overrideIntent === 'action_question_inquiry' ||
				overrideIntent === 'question' ||
				overrideIntent === 'action_greeting_reply' ||
				overrideIntent === 'greeting') &&
			/\b(khoe khong|khoe ko|khoe k|khoe chu|khoe ha|dao nay the nao|co khoe khong|co khoe ko|on khong|ok khong)\b/.test(clean)
		) {
			const healthMap = {
				cháu: ['Cảm ơn cháu, chú khỏe.', 'Chú khỏe, cảm ơn cháu nhé.', 'Dạ chú khỏe, cảm ơn cháu.', 'Chú vẫn khỏe, cháu thế nào?'],
				em: ['Cảm ơn em, anh khỏe.', 'Anh khỏe, cảm ơn em nhé.', 'Dạ cảm ơn em, anh khỏe.', 'Anh vẫn khỏe, em thế nào?'],
				anh: ['Cảm ơn anh, em khỏe.', 'Dạ em khỏe, cảm ơn anh nhé.', 'Em vẫn khỏe, anh thế nào?'],
				chị: ['Cảm ơn chị, em khỏe.', 'Dạ em khỏe, cảm ơn chị nhé.', 'Em vẫn khỏe, chị thế nào?'],
				sếp: ['Dạ em cảm ơn sếp, em vẫn khỏe ạ.', 'Dạ em khỏe, cảm ơn sếp ạ.'],
				thầy: ['Dạ em cảm ơn thầy, em vẫn khỏe ạ.', 'Dạ em khỏe, cảm ơn thầy ạ.'],
				cậu: ['Cảm ơn cậu, tớ khỏe.', 'Tớ khỏe, cảm ơn cậu nhé.', 'Tớ vẫn khỏe, cậu thế nào?'],
				ông: ['Cảm ơn ông, tôi khỏe.', 'Tôi khỏe, cảm ơn ông nhé.'],
				bà: ['Cảm ơn bà, tôi khỏe.', 'Tôi khỏe, cảm ơn bà nhé.'],
				bác: ['Dạ cảm ơn bác, cháu khỏe ạ.', 'Dạ cháu khỏe, cảm ơn bác ạ.'],
				chú:
					speaker === 'anh'
						? ['Cảm ơn chú, anh khỏe.', 'Anh khỏe, cảm ơn chú nhé.', 'Dạ anh khỏe, cảm ơn chú.', 'Anh vẫn khỏe, chú thế nào?']
						: ['Dạ cảm ơn chú, cháu khỏe ạ.', 'Dạ cháu khỏe, cảm ơn chú ạ.'],
				cô: ['Dạ cảm ơn cô, cháu khỏe ạ.', 'Dạ cháu khỏe, cảm ơn cô ạ.'],
				'cả nhà': ['Cảm ơn cả nhà, mình vẫn khỏe nhé!', 'Cả nhà thế nào, mình vẫn khỏe.'],
				bạn: ['Cảm ơn bạn, mình khỏe.', 'Mình khỏe, cảm ơn bạn nhé.', 'Mình vẫn khỏe, bạn thế nào?']
			};
			const customHealth = healthMap[role] || healthMap['bạn'];
			for (let i = customHealth.length - 1; i >= 0; i--) {
				if (!replies.includes(customHealth[i])) {
					replies.unshift(customHealth[i]);
				}
			}
		}
		return replies.slice(0, topK);
	}
	static normalizePronoun(pronoun: null) {
		throw new Error('Method not implemented.');
	}
	static resolvePronounPair(previousMessage: any, role: any, arg2: null) {
		throw new Error('Method not implemented.');
	}
	static generateDynamicReplies(arg0: string, speaker: never, role: any, topK: number) {
		throw new Error('Method not implemented.');
	}

	onKeystroke(text, topK = 5, previousMessage = null, pronoun = null) {
		const correction = this.correct(text);
		const result = {
			input: text,
			correction,
			suggestions: []
		};
		if (previousMessage) {
			result.pronoun = this.detectPronounContext(previousMessage);
			result.candidatePronouns = this.detectPronounCandidates(previousMessage);
			result.quickReplies = this.suggestQuickReplies(previousMessage, topK, pronoun);
		}
		return result;
	}

	async loadModel(modelPath = '../weights/tinylm/model.onnx', ortInstance = null) {
		const ortLib = ortInstance || (typeof ort !== 'undefined' ? ort : typeof window !== 'undefined' ? window.ort : null);
		if (!ortLib) {
			throw new Error('ONNX Runtime (ort) is not available.');
		}
		this.ort = ortLib;
		this.modelSession = await ortLib.InferenceSession.create(modelPath, {
			executionProviders: ['wasm']
		});
		this.modelLoaded = true;
		return this.modelSession;
	}

	isModelLoaded() {
		return !!(this.modelLoaded && this.modelSession);
	}

	async loadAccentModel(modelPath = '../weights/tinylm/accent_model.onnx', ortInstance = null) {
		const ortLib = ortInstance || this.ort || (typeof ort !== 'undefined' ? ort : typeof window !== 'undefined' ? window.ort : null);
		if (!ortLib) {
			throw new Error('ONNX Runtime (ort) is not available.');
		}
		this.ort = ortLib;
		this.accentSession = await ortLib.InferenceSession.create(modelPath, {
			executionProviders: ['wasm']
		});
		this.accentModelLoaded = true;
		return this.accentSession;
	}

	isAccentModelLoaded() {
		return !!(this.accentModelLoaded && this.accentSession);
	}

	async loadAllModels(modelDir = '../weights/tinylm', ortInstance = null) {
		const ortLib = ortInstance || this.ort || (typeof ort !== 'undefined' ? ort : typeof window !== 'undefined' ? window.ort : null);
		if (!ortLib) {
			throw new Error('ONNX Runtime (ort) is not available.');
		}
		this.ort = ortLib;
		await Promise.all([
			this.loadModel(`${modelDir}/model.onnx`, ortLib).catch(() => {}),
			this.loadAccentModel(`${modelDir}/accent_model.onnx`, ortLib).catch(() => {})
		]);
		return { lmLoaded: this.modelLoaded, accentLoaded: this.accentModelLoaded };
	}

	tokenize(text) {
		const vocab = MezonGrammarClient.TINYLM_VOCAB || {};
		const tokens = [];
		let cur = '';
		for (let i = 0; i < text.length; i++) {
			const c = text[i];
			if (c === ' ' || c === '\n' || c === '\t') {
				if (cur.length > 0) {
					tokens.push(cur);
					cur = '';
				}
				tokens.push(c);
			} else if (vocab[c] !== undefined && vocab[c] <= 47) {
				if (cur.length > 0) {
					tokens.push(cur);
					cur = '';
				}
				tokens.push(c);
			} else {
				cur += c;
			}
		}
		if (cur.length > 0) {
			tokens.push(cur);
		}

		const finalTokens = [];
		for (const t of tokens) {
			if (vocab[t] !== undefined) {
				finalTokens.push(t);
			} else {
				const lower = t.toLowerCase();
				if (vocab[lower] !== undefined) {
					finalTokens.push(lower);
				} else {
					for (let i = 0; i < t.length; i++) {
						finalTokens.push(t[i]);
					}
				}
			}
		}
		return finalTokens;
	}

	encode(text, addSpecialTokens = false) {
		const vocab = MezonGrammarClient.TINYLM_VOCAB || {};
		const tokens = this.tokenize(text);
		const ids = [];
		if (addSpecialTokens) {
			ids.push(vocab['<s>'] !== undefined ? vocab['<s>'] : 2);
		}
		for (const tok of tokens) {
			if (vocab[tok] !== undefined) {
				ids.push(vocab[tok]);
			} else {
				for (let i = 0; i < tok.length; i++) {
					const ch = tok[i];
					ids.push(vocab[ch] !== undefined ? vocab[ch] : vocab['<unk>'] !== undefined ? vocab['<unk>'] : 1);
				}
			}
		}
		if (addSpecialTokens) {
			ids.push(vocab['</s>'] !== undefined ? vocab['</s>'] : 3);
		}
		return ids;
	}

	decode(tokenIds, skipSpecialTokens = true) {
		const idToToken = this.getIdToTokenMap();
		const specials = new Set([0, 1, 2, 3, 4]);
		const parts = [];
		for (const id of tokenIds) {
			if (skipSpecialTokens && specials.has(id)) continue;
			parts.push(idToToken[id] || '');
		}
		return parts.join('');
	}

	getIdToTokenMap() {
		if (!this._idToToken) {
			this._idToToken = {};
			const vocab = MezonGrammarClient.TINYLM_VOCAB || {};
			for (const [tok, id] of Object.entries(vocab)) {
				this._idToToken[id] = tok;
			}
		}
		return this._idToToken;
	}

	async predictIntentNeural(text) {
		if (!this.isModelLoaded() || !this.ort || !text || !text.trim()) {
			return null;
		}
		const cleanText = text.trim();
		if (!this._intentCache) this._intentCache = new Map();
		if (this._intentCache.has(cleanText)) {
			return this._intentCache.get(cleanText);
		}
		try {
			const tokenIds = this.encode(cleanText, true);
			if (!tokenIds || tokenIds.length === 0) return null;

			const seq = tokenIds.slice(-128);
			const inputTensor = new this.ort.Tensor('int64', BigInt64Array.from(seq.map(BigInt)), [1, seq.length]);
			const feeds = { input_ids: inputTensor };
			const results = await this.modelSession.run(feeds);
			const outputTensor = results.intent_logits || results[Object.keys(results)[0]];
			if (!outputTensor) return null;

			const intentLogits = outputTensor.data;
			const labels = MezonGrammarClient.INTENT_LABELS;
			const numIntents = labels.length;

			let maxLogit = -Infinity;
			for (let i = 0; i < numIntents; i++) {
				if (intentLogits[i] > maxLogit) maxLogit = intentLogits[i];
			}

			let sumExp = 0;
			const probs = new Float32Array(numIntents);
			for (let i = 0; i < numIntents; i++) {
				probs[i] = Math.exp(intentLogits[i] - maxLogit);
				sumExp += probs[i];
			}
			for (let i = 0; i < numIntents; i++) {
				probs[i] /= sumExp || 1.0;
			}

			let topIdx = 0;
			let topProb = probs[0];
			const distribution = {};
			for (let i = 0; i < numIntents; i++) {
				distribution[labels[i]] = Math.round(probs[i] * 1000) / 1000;
				if (probs[i] > topProb) {
					topProb = probs[i];
					topIdx = i;
				}
			}

			const topAction = labels[topIdx];
			const res = {
				action: topAction,
				intent: topAction,
				description: (MezonGrammarClient.ACTION_DESCRIPTIONS && MezonGrammarClient.ACTION_DESCRIPTIONS[topAction]) || topAction,
				confidence: Math.round(topProb * 1000) / 1000,
				distribution
			};

			if (this._intentCache.size >= 256) {
				const firstKey = this._intentCache.keys().next().value;
				this._intentCache.delete(firstKey);
			}
			this._intentCache.set(cleanText, res);
			return res;
		} catch (e) {
			return null;
		}
	}

	async predictActionNeural(text) {
		return this.predictIntentNeural(text);
	}

	async suggestQuickRepliesAsync(previousMessage, topK = 4, pronoun = null, minConfidence = 0.8, speaker = null) {
		let neuralIntent = null;
		let confidence = null;
		if (this.isModelLoaded() && this.ort && previousMessage) {
			const intentRes = await this.predictActionNeural(previousMessage);
			if (intentRes) {
				confidence = intentRes.confidence;
				// User rule: only show suggest if prob/confidence >= 80% (0.80)
				if (confidence < minConfidence) {
					return [];
				}
				neuralIntent = intentRes.action || intentRes.intent;
			}
		}

		if (neuralIntent === 'action_no_reply_needed' || neuralIntent === 'reply_none' || neuralIntent === 'other') {
			return [];
		}

		const baseReplies = this.suggestQuickReplies(previousMessage, topK, pronoun, neuralIntent, confidence, minConfidence, speaker);
		return baseReplies.slice(0, topK);
	}

	_rescoreWithCollocations(text, originalText = null) {
		if (!text || !text.trim()) return text;
		const tokens = text.match(/[\p{L}\p{M}\d]+|[^\p{L}\p{M}\d]/gu) || [];
		const alphaIndices = [];
		for (let i = 0; i < tokens.length; i++) {
			if (/\p{L}/u.test(tokens[i])) {
				alphaIndices.push(i);
			}
		}
		const matchedIndices = new Set();

		const unaccentedMask = new Array(tokens.length).fill(true);
		if (originalText) {
			const origTokens = originalText.match(/[\p{L}\p{M}\d]+|[^\p{L}\p{M}\d]/gu) || [];
			if (origTokens.length === tokens.length) {
				for (let i = 0; i < tokens.length; i++) {
					unaccentedMask[i] = origTokens[i].toLowerCase() === stripAccents(origTokens[i]).toLowerCase();
				}
			}
		}

		// 1. Trigram collocations (longest-match 3-word priority)
		if (alphaIndices.length >= 3) {
			for (let k = 0; k < alphaIndices.length - 2; k++) {
				const i0 = alphaIndices[k];
				const i1 = alphaIndices[k + 1];
				const i2 = alphaIndices[k + 2];
				const w0 = tokens[i0],
					w1 = tokens[i1],
					w2 = tokens[i2];
				const u0 = stripAccents(w0).toLowerCase();
				const u1 = stripAccents(w1).toLowerCase();
				const u2 = stripAccents(w2).toLowerCase();
				const key = `${u0}_${u1}_${u2}`;
				if (TRIGRAM_COLLOCATIONS_MAP[key]) {
					const col = TRIGRAM_COLLOCATIONS_MAP[key];
					if (unaccentedMask[i0]) tokens[i0] = matchCase(w0, col[0]);
					if (unaccentedMask[i1]) tokens[i1] = matchCase(w1, col[1]);
					if (unaccentedMask[i2]) tokens[i2] = matchCase(w2, col[2]);
					matchedIndices.add(i0);
					matchedIndices.add(i1);
					matchedIndices.add(i2);
				}
			}
		}

		// 2. Bigram collocations (2-word contextual priority)
		if (alphaIndices.length >= 2) {
			for (let k = 0; k < alphaIndices.length - 1; k++) {
				const i0 = alphaIndices[k];
				const i1 = alphaIndices[k + 1];
				if (matchedIndices.has(i0) && matchedIndices.has(i1)) {
					continue;
				}
				const w0 = tokens[i0],
					w1 = tokens[i1];
				const u0 = stripAccents(w0).toLowerCase();
				const u1 = stripAccents(w1).toLowerCase();
				const key = `${u0}_${u1}`;
				if (COLLOCATIONS_MAP[key]) {
					const col = COLLOCATIONS_MAP[key];
					if (!matchedIndices.has(i0) && unaccentedMask[i0]) {
						tokens[i0] = matchCase(w0, col[0]);
						matchedIndices.add(i0);
					}
					if (!matchedIndices.has(i1) && unaccentedMask[i1]) {
						tokens[i1] = matchCase(w1, col[1]);
						matchedIndices.add(i1);
					}
				}
			}
		}

		let resultText = tokens.join('');

		// 3. Post-check confusable multi-word phrases (e.g. ôi giới ơi -> ôi giời ơi, thôi chột -> thui chột)
		const sortedConfusables = Object.entries(CONFUSABLE_PHRASES)
			.filter(([k]) => k.includes(' '))
			.sort((a, b) => b[0].length - a[0].length);
		for (const [wrongP, rightP] of sortedConfusables) {
			const wLower = wrongP.toLowerCase();
			const escaped = wLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp('(?<![\\p{L}\\p{N}])' + escaped + '(?![\\p{L}\\p{N}])', 'gui');
			resultText = resultText.replace(regex, (match) => {
				if (match && match[0] === match[0].toUpperCase()) {
					return rightP[0].toUpperCase() + rightP.slice(1);
				}
				return rightP;
			});
		}

		return resultText;
	}

	_decodeBeamSearch(chars, logitsData, protectedIndices = new Set(), beamWidth = 4) {
		const vocabSize = 256;
		const T = chars.length;

		// Log-softmax of logitsData
		const logProbs = new Float32Array(T * vocabSize);
		for (let i = 0; i < T; i++) {
			const offset = i * vocabSize;
			let maxLogit = -Infinity;
			for (let v = 0; v < vocabSize; v++) {
				if (logitsData[offset + v] > maxLogit) maxLogit = logitsData[offset + v];
			}
			let sumExp = 0.0;
			for (let v = 0; v < vocabSize; v++) {
				sumExp += Math.exp(logitsData[offset + v] - maxLogit);
			}
			const logSumExp = maxLogit + Math.log(sumExp);
			for (let v = 0; v < vocabSize; v++) {
				logProbs[offset + v] = logitsData[offset + v] - logSumExp;
			}
		}

		let beams = [{ score: 0.0, chars: [], currWord: [], words: [] }];

		for (let i = 0; i < T; i++) {
			const c = chars[i];
			const base = stripAccents(c);
			let candidates;

			if (protectedIndices.has(i) || c !== base || !MezonGrammarClient.ACCENT_VOWEL_VARIANTS[base]) {
				candidates = [c];
			} else {
				let candChars = MezonGrammarClient.ACCENT_VOWEL_VARIANTS[base];
				const following = chars
					.slice(i + 1, i + 3)
					.join('')
					.toLowerCase();
				if (base === 'a' && (following.startsWith('nh') || following.startsWith('ch'))) {
					candChars = candChars.filter((cc) => !/[ăằắẳẵặâầấẩẫậ]/u.test(cc));
				}
				if (base === 'o' && (following.startsWith('nh') || following.startsWith('ch'))) {
					candChars = candChars.filter((cc) => !/[ôồốổỗộơờớởỡợ]/u.test(cc));
				}
				if (base === 'u' && (following.startsWith('nh') || following.startsWith('ch'))) {
					candChars = candChars.filter((cc) => !/[ưừứửữự]/u.test(cc));
				}

				let endPos = i + 1;
				while (endPos < chars.length && /\p{L}/u.test(chars[endPos])) {
					endPos++;
				}
				const remainder = chars
					.slice(i + 1, endPos)
					.join('')
					.toLowerCase();
				const hasStopCoda = ['ch', 'c', 'p', 't'].some((coda) => remainder.endsWith(coda));
				if (hasStopCoda) {
					const hasFollowingVowels = /[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/u.test(remainder);
					if (hasFollowingVowels) {
						const toneZero = candChars.filter((cc) => {
							const info = CHAR_TO_TONE[cc.toLowerCase()];
							return info && info.toneIdx === 0;
						});
						if (toneZero.length > 0) candChars = toneZero;
					} else {
						const stopAllowed = candChars.filter((cc) => {
							const t = extractTone(cc);
							return t.tone === 2 || t.tone === 5;
						});
						if (stopAllowed.length > 0) candChars = stopAllowed;
					}
				}
				candidates = candChars;
			}

			const offset = i * vocabSize;
			const newBeams = [];

			for (const b of beams) {
				const hasExistingTone = b.currWord.some((wc) => CHAR_TO_TONE[wc.toLowerCase()] && CHAR_TO_TONE[wc.toLowerCase()].toneIdx !== 0);
				for (const cand of candidates) {
					const candTone = CHAR_TO_TONE[cand.toLowerCase()] ? CHAR_TO_TONE[cand.toLowerCase()].toneIdx : 0;
					if (hasExistingTone && candTone !== 0) {
						continue; // forbid multiple tone marks in the same syllable
					}
					const cid = MezonGrammarClient.ACCENT_CHAR_TO_ID ? MezonGrammarClient.ACCENT_CHAR_TO_ID[cand] : undefined;
					const logP = cid !== undefined ? logProbs[offset + cid] : -10.0;
					let candScore = b.score + logP;

					// Prune invalid diphthong 'ưô'
					if (b.currWord.length > 0) {
						const prevChar = b.currWord[b.currWord.length - 1];
						if (/[ưừứửữự]/u.test(prevChar) && base === 'o' && /[ôồốổỗộ]/u.test(cand)) {
							continue;
						}
					}

					const isAlpha = /\p{L}/u.test(cand);
					const nextChars = [...b.chars, cand];
					let nextCurrWord;
					let nextWords;

					if (isAlpha) {
						nextCurrWord = [...b.currWord, cand];
						nextWords = b.words;
					} else {
						if (b.currWord.length > 0) {
							const w = b.currWord.join('');
							nextWords = [...b.words, w];
							if (isValidVietnameseSyllable(w)) {
								candScore += 1.0;
							} else {
								candScore -= 5.0;
							}
							if (nextWords.length >= 2) {
								const w1 = nextWords[nextWords.length - 2];
								const w2 = nextWords[nextWords.length - 1];
								const kBigram = `${stripAccents(w1).toLowerCase()}_${stripAccents(w2).toLowerCase()}`;
								if (COLLOCATIONS_MAP[kBigram]) {
									const col = COLLOCATIONS_MAP[kBigram];
									if (w1.toLowerCase() === col[0].toLowerCase() && w2.toLowerCase() === col[1].toLowerCase()) {
										candScore += 2.5;
									}
								}
							}
							if (nextWords.length >= 3) {
								const w1 = nextWords[nextWords.length - 3];
								const w2 = nextWords[nextWords.length - 2];
								const w3 = nextWords[nextWords.length - 1];
								const kTrigram = `${stripAccents(w1).toLowerCase()}_${stripAccents(w2).toLowerCase()}_${stripAccents(w3).toLowerCase()}`;
								if (TRIGRAM_COLLOCATIONS_MAP[kTrigram]) {
									const col = TRIGRAM_COLLOCATIONS_MAP[kTrigram];
									if (
										w1.toLowerCase() === col[0].toLowerCase() &&
										w2.toLowerCase() === col[1].toLowerCase() &&
										w3.toLowerCase() === col[2].toLowerCase()
									) {
										candScore += 5.0;
									}
								}
							}
						} else {
							nextWords = b.words;
						}
						nextCurrWord = [];
					}

					newBeams.push({
						score: candScore,
						chars: nextChars,
						currWord: nextCurrWord,
						words: nextWords
					});
				}
			}

			newBeams.sort((a, b) => b.score - a.score);
			beams = newBeams.slice(0, beamWidth);
		}

		// Final word boundary scoring
		for (const b of beams) {
			if (b.currWord.length > 0) {
				const w = b.currWord.join('');
				b.words = [...b.words, w];
				if (isValidVietnameseSyllable(w)) {
					b.score += 1.0;
				} else {
					b.score -= 5.0;
				}
				if (b.words.length >= 2) {
					const w1 = b.words[b.words.length - 2];
					const w2 = b.words[b.words.length - 1];
					const kBigram = `${stripAccents(w1).toLowerCase()}_${stripAccents(w2).toLowerCase()}`;
					if (COLLOCATIONS_MAP[kBigram]) {
						const col = COLLOCATIONS_MAP[kBigram];
						if (w1.toLowerCase() === col[0].toLowerCase() && w2.toLowerCase() === col[1].toLowerCase()) {
							b.score += 2.5;
						}
					}
				}
				if (b.words.length >= 3) {
					const w1 = b.words[b.words.length - 3];
					const w2 = b.words[b.words.length - 2];
					const w3 = b.words[b.words.length - 1];
					const kTrigram = `${stripAccents(w1).toLowerCase()}_${stripAccents(w2).toLowerCase()}_${stripAccents(w3).toLowerCase()}`;
					if (TRIGRAM_COLLOCATIONS_MAP[kTrigram]) {
						const col = TRIGRAM_COLLOCATIONS_MAP[kTrigram];
						if (
							w1.toLowerCase() === col[0].toLowerCase() &&
							w2.toLowerCase() === col[1].toLowerCase() &&
							w3.toLowerCase() === col[2].toLowerCase()
						) {
							b.score += 5.0;
						}
					}
				}
			}
		}

		beams.sort((a, b) => b.score - a.score);
		return beams[0].chars.join('');
	}

	async addAccentsNeural(text, maxSeqLen = 128, beamWidth = 4) {
		if (!text || !text.trim() || !this.isAccentModelLoaded()) {
			return text;
		}
		if (isPredominantlyEnglishSentence(text)) {
			return text;
		}

		// Solution 1: Pre-resolve & protect curated multi-word idioms and confusable phrases
		const multiWordEntries = Object.entries(CONFUSABLE_PHRASES)
			.filter(([k]) => k.includes(' '))
			.sort((a, b) => b[0].length - a[0].length);
		let resolvedText = text;
		for (const [wrongP, rightP] of multiWordEntries) {
			const wLower = wrongP.toLowerCase();
			const escaped = wLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp('(?<![\\p{L}\\p{N}])' + escaped + '(?![\\p{L}\\p{N}])', 'gui');
			resolvedText = resolvedText.replace(regex, (match) => {
				if (match && match[0] === match[0].toUpperCase()) {
					return rightP[0].toUpperCase() + rightP.slice(1);
				}
				return rightP;
			});
		}
		text = resolvedText;

		const words = text.match(/[\p{L}\p{M}\d]+|[^\p{L}\p{M}\d]/gu) || [];
		const protectedIndices = new Set();
		let charPos = 0;
		for (const w of words) {
			if (isForeignOrTechWord(w)) {
				for (let idx = charPos; idx < charPos + w.length; idx++) {
					protectedIndices.add(idx);
				}
			}
			charPos += w.length;
		}

		// Protect isolated ambiguous words with no surrounding context
		const alphaTokens = words.filter((w) => /\p{L}/u.test(w));
		if (alphaTokens.length <= 1) {
			for (const w of alphaTokens) {
				if (/^(toi|ban|oi|thui|da|bn)$/i.test(w)) {
					for (let idx = 0; idx < text.length; idx++) {
						protectedIndices.add(idx);
					}
				}
			}
		}

		// Protect curated multi-word phrases already resolved by confusable rules
		const lowerText = text.toLowerCase();
		for (const rightPhrase of Object.values(CONFUSABLE_PHRASES)) {
			const rLower = rightPhrase.toLowerCase();
			if (rLower.includes(' ') && lowerText.includes(rLower)) {
				let start = 0;
				while (true) {
					const pos = lowerText.indexOf(rLower, start);
					if (pos === -1) break;
					const beforeOk = pos === 0 || !/\p{L}|\p{N}/u.test(text[pos - 1]);
					const afterPos = pos + rLower.length;
					const afterOk = afterPos === text.length || !/\p{L}|\p{N}/u.test(text[afterPos]);
					if (beforeOk && afterOk) {
						for (let idx = pos; idx < afterPos; idx++) {
							protectedIndices.add(idx);
						}
					}
					start = afterPos;
				}
			}
		}

		const chars = Array.from(text.slice(0, maxSeqLen));
		const inputIds = new BigInt64Array(chars.length);
		for (let i = 0; i < chars.length; i++) {
			const c = chars[i];
			const id = MezonGrammarClient.ACCENT_CHAR_TO_ID ? MezonGrammarClient.ACCENT_CHAR_TO_ID[c] : undefined;
			inputIds[i] = BigInt(id !== undefined ? id : 1);
		}

		const tensor = new this.ort.Tensor('int64', inputIds, [1, chars.length]);
		const inputName = this.accentSession.inputNames[0];
		const feeds = {};
		feeds[inputName] = tensor;
		const outputMap = await this.accentSession.run(feeds);
		const outputName = this.accentSession.outputNames[0];
		const logitsTensor = outputMap[outputName];
		const logitsData = logitsTensor.data; // Float32Array shape [1, T, vocabSize]
		const vocabSize = 256;

		let rawDecoded;
		if (beamWidth > 1) {
			rawDecoded = this._decodeBeamSearch(chars, logitsData, protectedIndices, beamWidth);
		} else {
			const resultChars = [];
			for (let i = 0; i < chars.length; i++) {
				const c = chars[i];
				if (protectedIndices.has(i)) {
					resultChars.push(c);
					continue;
				}
				const base = stripAccents(c);
				if (c !== base) {
					resultChars.push(c);
					continue;
				}

				const variants = MezonGrammarClient.ACCENT_VOWEL_VARIANTS;
				if (variants && variants[base]) {
					let candChars = variants[base];
					const following = text.slice(i + 1, i + 3).toLowerCase();

					if (base === 'a' && (following.startsWith('nh') || following.startsWith('ch'))) {
						candChars = candChars.filter((cc) => !/[ăằắẳẵặâầấẩẫậ]/u.test(cc));
					}
					if (base === 'o' && (following.startsWith('nh') || following.startsWith('ch'))) {
						candChars = candChars.filter((cc) => !/[ôồốổỗộơờớởỡợ]/u.test(cc));
					}
					if (base === 'u' && (following.startsWith('nh') || following.startsWith('ch'))) {
						candChars = candChars.filter((cc) => !/[ưừứửữự]/u.test(cc));
					}

					const prevC = i > 0 ? chars[i - 1].toLowerCase() : '';
					if (/[ưừứửữự]/u.test(prevC) && base === 'o') {
						candChars = candChars.filter((cc) => !/[ôồốổỗộ]/u.test(cc));
					}

					let endPos = i + 1;
					while (endPos < chars.length && /\p{L}/u.test(chars[endPos])) {
						endPos++;
					}
					const remainder = text.slice(i + 1, endPos).toLowerCase();
					const hasStopCoda = ['ch', 'c', 'p', 't'].some((coda) => remainder.endsWith(coda));
					if (hasStopCoda) {
						const hasFollowingVowels = /[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/u.test(remainder);
						if (hasFollowingVowels) {
							const toneZero = candChars.filter((cc) => {
								const info = CHAR_TO_TONE[cc.toLowerCase()];
								return info && info.toneIdx === 0;
							});
							if (toneZero.length > 0) candChars = toneZero;
						} else {
							const stopAllowed = candChars.filter((cc) => {
								const t = extractTone(cc);
								return t.tone === 2 || t.tone === 5;
							});
							if (stopAllowed.length > 0) candChars = stopAllowed;
						}
					}

					let bestChar = c;
					let maxLogit = -Infinity;
					const offset = i * vocabSize;
					for (const cc of candChars) {
						const cid = MezonGrammarClient.ACCENT_CHAR_TO_ID[cc];
						if (cid !== undefined) {
							const logit = logitsData[offset + cid];
							if (logit > maxLogit) {
								maxLogit = logit;
								bestChar = cc;
							}
						}
					}
					resultChars.push(bestChar);
				} else {
					resultChars.push(c);
				}
			}
			rawDecoded = resultChars.join('');
		}

		// Solution 3 & 4: Word-level lattice & n-gram collocation rescorer
		const rawResult = rawDecoded + text.slice(maxSeqLen);
		return this._rescoreWithCollocations(rawResult, text);
	}

	async correctAsync(text) {
		const res = this.correct(text);
		if (!this.isAccentModelLoaded() || !res.corrected || isPredominantlyEnglishSentence(text)) {
			return res;
		}

		try {
			const beforeNeural = res.corrected;
			let afterNeural = await this.addAccentsNeural(beforeNeural);
			if (afterNeural !== beforeNeural) {
				afterNeural = afterNeural.replace(/(^|[.?!]\s+)(\p{L})/gu, (m, prefix, char) => prefix + char.toUpperCase());
				res.edits.push({
					original: beforeNeural,
					replacement: afterNeural,
					reason: 'Khôi phục dấu thanh bằng mô hình học máy (Neural Accent Model)'
				});
				res.corrected = afterNeural.trim();
				res.hasErrors = res.corrected !== text.trim();
			}
		} catch (e) {
			// Fallback gracefully to rule-based correction if neural pass fails
		}
		return res;
	}

	async onKeystrokeAsync(text, topK = 5, previousMessage = null, pronoun = null) {
		const correction = await this.correctAsync(text);
		const result = {
			input: text,
			correction,
			suggestions: []
		};
		if (previousMessage) {
			result.pronoun = this.detectPronounContext(previousMessage);
			result.candidatePronouns = this.detectPronounCandidates(previousMessage);
			result.neuralIntent = await this.predictIntentNeural(previousMessage);
			result.quickReplies = await this.suggestQuickRepliesAsync(previousMessage, topK, pronoun);
		}
		return result;
	}
}

MezonGrammarClient.RESPONSE_ACTIONS = [
	'action_general_ack',
	'action_greeting_reply',
	'action_thanks_reply',
	'action_apology_forgive',
	'action_question_inquiry',
	'action_task_accept',
	'action_leave_ack',
	'action_praise_receive',
	'action_no_reply_needed',
	'action_confirm_yes',
	'action_health_ack',
	'action_meal_social'
];

MezonGrammarClient.ACTION_DESCRIPTIONS = {
	action_general_ack: 'Xác nhận chung (OK / Nhất trí)',
	action_greeting_reply: 'Chào hỏi đối thoại',
	action_thanks_reply: 'Phản hồi cảm ơn (Không có chi)',
	action_apology_forgive: 'Phản hồi xin lỗi (Không sao đâu)',
	action_question_inquiry: 'Phản hồi câu hỏi (Kiểm tra & báo lại)',
	action_task_accept: 'Nhận xử lý công việc',
	action_leave_ack: 'Xác nhận & chúc nghỉ ngơi',
	action_praise_receive: 'Cảm ơn lời khen',
	action_no_reply_needed: 'Không cần gợi ý phản hồi',
	action_confirm_yes: 'Xác nhận đồng ý / Có',
	action_health_ack: 'Phản hồi thăm hỏi sức khỏe',
	action_meal_social: 'Phản hồi ăn uống / đám cưới'
};

MezonGrammarClient.ACTION_ALIASES = {
	action_general_ack: 'general',
	action_greeting_reply: 'greeting',
	action_thanks_reply: 'thanks',
	action_apology_forgive: 'apology',
	action_question_inquiry: 'question',
	action_task_accept: 'task_or_update',
	action_leave_ack: 'leave_or_absence',
	action_praise_receive: 'praise',
	action_no_reply_needed: 'other',
	action_confirm_yes: 'yes_no_question',
	action_health_ack: 'health_inquiry',
	action_meal_social: 'meal_or_social_invite',
	general: 'action_general_ack',
	greeting: 'action_greeting_reply',
	thanks: 'action_thanks_reply',
	apology: 'action_apology_forgive',
	question: 'action_question_inquiry',
	task_or_update: 'action_task_accept',
	leave_or_absence: 'action_leave_ack',
	praise: 'action_praise_receive',
	other: 'action_no_reply_needed',
	yes_no_question: 'action_confirm_yes',
	health_inquiry: 'action_health_ack',
	meal_or_social_invite: 'action_meal_social',
	// Reply aliases
	reply_general: 'action_general_ack',
	reply_greeting: 'action_greeting_reply',
	reply_thanks: 'action_thanks_reply',
	reply_apology: 'action_apology_forgive',
	reply_question: 'action_question_inquiry',
	reply_task_ack: 'action_task_accept',
	reply_task_accept: 'action_task_accept',
	reply_leave_ack: 'action_leave_ack',
	reply_praise: 'action_praise_receive',
	reply_none: 'action_no_reply_needed',
	reply_confirm_yes: 'action_confirm_yes',
	reply_health: 'action_health_ack'
};

MezonGrammarClient.LEGACY_TO_ACTION = {
	general: 'action_general_ack',
	greeting: 'action_greeting_reply',
	thanks: 'action_thanks_reply',
	apology: 'action_apology_forgive',
	question: 'action_question_inquiry',
	task_or_update: 'action_task_accept',
	leave_or_absence: 'action_leave_ack',
	praise: 'action_praise_receive',
	other: 'action_no_reply_needed',
	yes_no_question: 'action_confirm_yes',
	health_inquiry: 'action_health_ack',
	meal_or_social_invite: 'action_meal_social',
	reply_general: 'action_general_ack',
	reply_greeting: 'action_greeting_reply',
	reply_thanks: 'action_thanks_reply',
	reply_apology: 'action_apology_forgive',
	reply_question: 'action_question_inquiry',
	reply_task_ack: 'action_task_accept',
	reply_task_accept: 'action_task_accept',
	reply_leave_ack: 'action_leave_ack',
	reply_praise: 'action_praise_receive',
	reply_none: 'action_no_reply_needed',
	reply_confirm_yes: 'action_confirm_yes',
	reply_health: 'action_health_ack',
	reply_meal_social: 'action_meal_social'
};

MezonGrammarClient.DEFAULT_SPEAKER_FOR_ADDRESSEE = {
	anh: 'em',
	chị: 'em',
	sếp: 'em',
	thầy: 'em',
	bác: 'cháu',
	chú: 'cháu',
	cô: 'cháu',
	ông: 'cháu',
	bà: 'cháu',
	cháu: 'chú',
	em: 'anh',
	cậu: 'tớ',
	bạn: 'mình',
	mình: 'bạn',
	'cả nhà': 'em'
};

MezonGrammarClient.renderDynamicTemplate = function (template, speaker, addressee) {
	let spk = MezonGrammarClient.normalizePronoun(speaker) || (speaker ? speaker.trim() : 'mình');
	let addr = MezonGrammarClient.normalizePronoun(addressee) || (addressee ? addressee.trim() : 'bạn');

	// Vietnamese linguistic rule: There is NO valid pair "chú nói với em".
	// If addressee is "em", speaker is strictly "anh" (or "chị").
	if (spk === 'chú' && addr === 'em') {
		spk = 'anh';
	} else if (spk === 'em' && addr === 'chú') {
		spk = 'cháu';
	}

	let rendered = template.replace(/\[X\]/gi, addr).replace(/\[Y\]/gi, spk);
	const parts = rendered.split(/([.!?]\s*)/);
	const out = [];
	for (let i = 0; i < parts.length; i++) {
		const p = parts[i];
		if (p && !/^[.!?\s]+$/.test(p)) {
			out.push(p.charAt(0).toUpperCase() + p.slice(1));
		} else {
			out.push(p);
		}
	}
	return out.join('');
};

MezonGrammarClient.resolvePronounPair = function (previousMessage = '', addressee = null, speaker = null) {
	let resolvedAddr = MezonGrammarClient.normalizePronoun(addressee);
	let resolvedSpk = MezonGrammarClient.normalizePronoun(speaker);

	if (!resolvedAddr) {
		if (previousMessage && previousMessage.trim()) {
			const clean = previousMessage
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '');
			if (/\b(chu)\b/.test(clean)) {
				resolvedAddr = 'cháu';
				if (!resolvedSpk) resolvedSpk = 'chú';
			} else {
				resolvedAddr = MezonGrammarClient.extractTargetPronoun(previousMessage);
			}
		} else {
			resolvedAddr = 'bạn';
		}
	}

	if (!resolvedSpk) {
		if (previousMessage && previousMessage.trim()) {
			const clean = previousMessage
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '');
			if (/\b(anh oi|a oi|anh)\b/.test(clean) && (resolvedAddr === 'em' || resolvedAddr === 'chú')) {
				resolvedSpk = 'anh';
			}
		}
		if (!resolvedSpk) {
			resolvedSpk = MezonGrammarClient.DEFAULT_SPEAKER_FOR_ADDRESSEE[resolvedAddr] || 'mình';
		}
	}

	// Enforce Vietnamese linguistic rules:
	// 1. "Chú nói với em" does NOT exist. If speaker is "chú" and addressee is "em", it normalizes to "anh".
	if (resolvedSpk === 'chú' && resolvedAddr === 'em') {
		resolvedSpk = 'anh';
	}
	// 2. "Anh nói với chú" is VALID and equivalent to "Anh nói với em".
	// (speaker="anh", addressee="chú" is preserved!)

	return { speaker: resolvedSpk, addressee: resolvedAddr };
};

MezonGrammarClient.DYNAMIC_ACTION_TEMPLATES = {
	action_health_ack: [
		'Cảm ơn [X], [Y] khỏe.',
		'[Y] khỏe, cảm ơn [X] nhé.',
		'Dạ [Y] khỏe, cảm ơn [X].',
		'[Y] vẫn khỏe, [X] thế nào?',
		'Dạ [Y] cảm ơn [X], [Y] vẫn khỏe ạ.',
		'Dạ [Y] khỏe, cảm ơn [X] ạ.'
	],
	action_meal_social: ['[Y] ăn rồi, cảm ơn [X].', 'Dạ chưa [X], lát [Y] đi ăn.', 'Có chứ [X], mai [Y] đi.', 'Đi chứ [X]!', 'Đi thôi [X] ơi!'],
	action_leave_ack: [
		'Dạ vâng [X].',
		'Dạ [X] cứ nghỉ ngơi nhé ạ.',
		'OK [X] nhé.',
		'Dạ [Y] rõ rồi [X].',
		'[X] cứ nghỉ ngơi nhé.',
		'Nghỉ ngơi cho khỏe nhé [X]!'
	],
	action_task_accept: ['OK, [X].', 'Dạ vâng [X].', 'Dạ để [Y] xử lý ngay ạ.', 'Nhất trí [X].', 'Dạ để [Y] kiểm tra ngay.', 'Để [Y] xem nhé [X].'],
	action_confirm_yes: ['Có chứ [X].', 'Dạ có [X].', 'Dạ được [X].', 'Được [X] nhé.', 'Dạ chưa [X] ơi.'],
	action_thanks_reply: [
		'Dạ không có gì [X]!',
		'Dạ không có chi [X].',
		'[Y] rất vui được hỗ trợ [X]!',
		'Không có gì đâu [X]!',
		'Chuyện nhỏ mà [X].'
	],
	action_apology_forgive: ['Dạ không sao đâu [X]!', 'Dạ [X] đừng bận tâm ạ.', 'Không vấn đề gì đâu [X] ạ.', 'Không sao đâu [X] nhé!'],
	action_greeting_reply: ['Dạ [Y] chào [X]!', 'Dạ [Y] nghe đây [X].', 'Chào [X] nhé!', '[Y] nghe đây [X].', 'Alo [X]!'],
	action_praise_receive: ['Dạ [Y] cảm ơn [X] nhiều ạ!', 'Cảm ơn [X] nhiều ạ!', 'Tuyệt vời [X] ơi!'],
	action_question_inquiry: ['Dạ được [X].', 'Dạ để [Y] kiểm tra lại rồi báo [X] nhé.', 'Dạ chưa [X] ơi.', 'Dạ có [X] nhé.'],
	action_general_ack: ['OK, [X].', 'Dạ vâng [X].', 'Nhất trí [X].', 'Dạ [Y] rõ rồi [X].'],
	action_no_reply_needed: []
};

MezonGrammarClient.generateDynamicReplies = function (action, speaker, addressee, topK = 4) {
	const canonicalAction = (MezonGrammarClient.LEGACY_TO_ACTION && MezonGrammarClient.LEGACY_TO_ACTION[action]) || action;
	if (canonicalAction === 'action_no_reply_needed' || canonicalAction === 'reply_none' || canonicalAction === 'other') {
		return [];
	}

	const pair = MezonGrammarClient.resolvePronounPair('', addressee, speaker);
	const spk = pair.speaker;
	const addr = pair.addressee;

	let templates = [];
	if (canonicalAction === 'action_health_ack' || canonicalAction === 'reply_health' || canonicalAction === 'health_inquiry') {
		if (addr === 'sếp' || addr === 'thầy') {
			templates = ['Dạ [Y] cảm ơn [X], [Y] vẫn khỏe ạ.', 'Dạ [Y] khỏe, cảm ơn [X] ạ.', 'Dạ [Y] ổn, cảm ơn [X] quan tâm ạ.'];
		} else if ((spk === 'em' || spk === 'cháu') && (addr === 'anh' || addr === 'chị' || addr === 'bác' || addr === 'chú' || addr === 'cô')) {
			templates = ['Cảm ơn [X], [Y] khỏe.', 'Dạ [Y] khỏe, cảm ơn [X] nhé.', '[Y] vẫn khỏe, [X] thế nào?', 'Dạ [Y] khỏe ạ.'];
		} else {
			templates = ['Cảm ơn [X], [Y] khỏe.', '[Y] khỏe, cảm ơn [X] nhé.', 'Dạ [Y] khỏe, cảm ơn [X].', '[Y] vẫn khỏe, [X] thế nào?'];
		}
	} else if (canonicalAction === 'action_leave_ack' || canonicalAction === 'reply_leave_ack' || canonicalAction === 'leave_or_absence') {
		if (spk === 'em' || spk === 'cháu') {
			templates = ['Dạ vâng [X].', 'Dạ [X] cứ nghỉ ngơi nhé ạ.', 'OK [X] nhé.', 'Dạ [Y] rõ rồi [X].', 'Dạ [X] nghỉ ngơi cho khỏe nhé ạ.'];
		} else {
			templates = ['OK [X] nhé.', '[X] cứ nghỉ ngơi nhé.', 'Được rồi [X] nhé.', '[Y] rõ rồi [X].', 'Nghỉ ngơi cho khỏe nhé [X]!'];
		}
	} else if (canonicalAction === 'action_meal_social' || canonicalAction === 'reply_meal_social' || canonicalAction === 'meal_or_social_invite') {
		if (spk === 'em' || spk === 'cháu') {
			templates = ['[Y] ăn rồi, cảm ơn [X].', 'Dạ chưa [X], lát [Y] đi ăn.', 'Đi chứ [X]!', 'Có chứ [X], mai [Y] đi.'];
		} else {
			templates = ['[Y] ăn rồi, cảm ơn [X].', 'Chưa [X], lát [Y] đi ăn.', 'Đi chứ [X]!', 'Có chứ [X], mai [Y] đi.'];
		}
	} else {
		templates = MezonGrammarClient.DYNAMIC_ACTION_TEMPLATES[canonicalAction] || MezonGrammarClient.DYNAMIC_ACTION_TEMPLATES['action_general_ack'];
	}

	const rendered = [];
	for (let i = 0; i < templates.length; i++) {
		const rep = MezonGrammarClient.renderDynamicTemplate(templates[i], spk, addr);
		if (!rendered.includes(rep)) {
			rendered.push(rep);
		}
		if (rendered.length >= topK) break;
	}
	return rendered;
};

MezonGrammarClient.INTENT_LABELS = MezonGrammarClient.RESPONSE_ACTIONS;

MezonGrammarClient.TINYLM_VOCAB = {
	'<pad>': 0,
	'<unk>': 1,
	'<s>': 2,
	'</s>': 3,
	'<mask>': 4,
	' ': 5,
	'!': 6,
	'"': 7,
	'#': 8,
	$: 9,
	'%': 10,
	'&': 11,
	"'": 12,
	'(': 13,
	')': 14,
	'*': 15,
	'+': 16,
	',': 17,
	'-': 18,
	'.': 19,
	'/': 20,
	0: 21,
	1: 22,
	2: 23,
	3: 24,
	4: 25,
	5: 26,
	6: 27,
	7: 28,
	8: 29,
	9: 30,
	':': 31,
	';': 32,
	'<': 33,
	'=': 34,
	'>': 35,
	'?': 36,
	'@': 37,
	'[': 38,
	'\\': 39,
	']': 40,
	'^': 41,
	_: 42,
	'`': 43,
	'{': 44,
	'|': 45,
	'}': 46,
	'~': 47,
	'\n': 48,
	'\t': 49,
	a: 50,
	à: 51,
	á: 52,
	ả: 53,
	ã: 54,
	ạ: 55,
	ă: 56,
	ằ: 57,
	ắ: 58,
	ẳ: 59,
	ẵ: 60,
	ặ: 61,
	â: 62,
	ầ: 63,
	ấ: 64,
	ẩ: 65,
	ẫ: 66,
	ậ: 67,
	b: 68,
	c: 69,
	d: 70,
	đ: 71,
	e: 72,
	è: 73,
	é: 74,
	ẻ: 75,
	ẽ: 76,
	ẹ: 77,
	ê: 78,
	ề: 79,
	ế: 80,
	ể: 81,
	ễ: 82,
	ệ: 83,
	g: 84,
	h: 85,
	i: 86,
	ì: 87,
	í: 88,
	ỉ: 89,
	ĩ: 90,
	ị: 91,
	k: 92,
	l: 93,
	m: 94,
	n: 95,
	o: 96,
	ò: 97,
	ó: 98,
	ỏ: 99,
	õ: 100,
	ọ: 101,
	ô: 102,
	ồ: 103,
	ố: 104,
	ổ: 105,
	ỗ: 106,
	ộ: 107,
	ơ: 108,
	ờ: 109,
	ớ: 110,
	ở: 111,
	ỡ: 112,
	ợ: 113,
	p: 114,
	q: 115,
	r: 116,
	s: 117,
	t: 118,
	u: 119,
	ù: 120,
	ú: 121,
	ủ: 122,
	ũ: 123,
	ụ: 124,
	ư: 125,
	ừ: 126,
	ứ: 127,
	ử: 128,
	ữ: 129,
	ự: 130,
	v: 131,
	x: 132,
	y: 133,
	ỳ: 134,
	ý: 135,
	ỷ: 136,
	ỹ: 137,
	ỵ: 138,
	A: 139,
	À: 140,
	Á: 141,
	Ả: 142,
	Ã: 143,
	Ạ: 144,
	Ă: 145,
	Ằ: 146,
	Ắ: 147,
	Ẳ: 148,
	Ẵ: 149,
	Ặ: 150,
	Â: 151,
	Ầ: 152,
	Ấ: 153,
	Ẩ: 154,
	Ẫ: 155,
	Ậ: 156,
	B: 157,
	C: 158,
	D: 159,
	Đ: 160,
	E: 161,
	È: 162,
	É: 163,
	Ẻ: 164,
	Ẽ: 165,
	Ẹ: 166,
	Ê: 167,
	Ề: 168,
	Ế: 169,
	Ể: 170,
	Ễ: 171,
	Ệ: 172,
	G: 173,
	H: 174,
	I: 175,
	Ì: 176,
	Í: 177,
	Ỉ: 178,
	Ĩ: 179,
	Ị: 180,
	K: 181,
	L: 182,
	M: 183,
	N: 184,
	O: 185,
	Ò: 186,
	Ó: 187,
	Ỏ: 188,
	Õ: 189,
	Ọ: 190,
	Ô: 191,
	Ồ: 192,
	Ố: 193,
	Ổ: 194,
	Ỗ: 195,
	Ộ: 196,
	Ơ: 197,
	Ờ: 198,
	Ớ: 199,
	Ở: 200,
	Ỡ: 201,
	Ợ: 202,
	P: 203,
	Q: 204,
	R: 205,
	S: 206,
	T: 207,
	U: 208,
	Ù: 209,
	Ú: 210,
	Ủ: 211,
	Ũ: 212,
	Ụ: 213,
	Ư: 214,
	Ừ: 215,
	Ứ: 216,
	Ử: 217,
	Ữ: 218,
	Ự: 219,
	V: 220,
	X: 221,
	Y: 222,
	Ỳ: 223,
	Ý: 224,
	Ỷ: 225,
	Ỹ: 226,
	Ỵ: 227,
	và: 228,
	bạn: 229,
	một: 230,
	có: 231,
	tôi: 232,
	việc: 233,
	được: 234,
	công: 235,
	lại: 236,
	là: 237,
	vui: 238,
	học: 239,
	ngày: 240,
	đã: 241,
	trong: 242,
	luôn: 243,
	tin: 244,
	mới: 245,
	cho: 246,
	của: 247,
	người: 248,
	quả: 249,
	không: 250,
	rất: 251,
	đang: 252,
	sinh: 253,
	để: 254,
	thành: 255,
	chúc: 256,
	tương: 257,
	làm: 258,
	nay: 259,
	vào: 260,
	lành: 261,
	bình: 262,
	an: 263,
	thể: 264,
	gửi: 265,
	nhắn: 266,
	cần: 267,
	kiểm: 268,
	tra: 269,
	động: 270,
	lòng: 271,
	nước: 272,
	đến: 273,
	những: 274,
	dụng: 275,
	năng: 276,
	dùng: 277,
	Tôi: 278,
	đi: 279,
	thông: 280,
	mọi: 281,
	kết: 282,
	sự: 283,
	tính: 284,
	hiệu: 285,
	khỏe: 286,
	gặp: 287,
	trò: 288,
	chuyện: 289,
	cùng: 290,
	ơn: 291,
	vì: 292,
	giúp: 293,
	đỡ: 294,
	lỗi: 295,
	chúng: 296,
	ta: 297,
	uống: 298,
	đẹp: 299,
	gia: 300,
	muốn: 301,
	hỏi: 302,
	về: 303,
	tài: 304,
	liệu: 305,
	chuẩn: 306,
	bị: 307,
	chu: 308,
	đáo: 309,
	sàng: 310,
	thống: 311,
	hoạt: 312,
	đồng: 313,
	với: 314,
	chờ: 315,
	sẽ: 316,
	cao: 317,
	em: 318,
	lai: 319,
	đất: 320,
	nỗ: 321,
	lực: 322,
	từ: 323,
	nhanh: 324,
	hỗ: 325,
	trợ: 326,
	tạo: 327,
	tiếp: 328,
	phản: 329,
	hồi: 330,
	thực: 331,
	thiết: 332,
	ưu: 333,
	nhớ: 334,
	nói: 335,
	đùm: 336,
	rách: 337,
	thì: 338,
	vô: 339,
	trung: 340,
	quý: 341,
	giá: 342,
	mang: 343,
	lớn: 344,
	khách: 345,
	niềm: 346,
	Xin: 347,
	xin: 348,
	cảm: 349,
	Bạn: 350,
	Chúc: 351,
	hệ: 352,
	ăn: 353,
	ứng: 354,
	lời: 355,
	lá: 356,
	chân: 357,
	gần: 358,
	cẩn: 359,
	chào: 360,
	thật: 361,
	vẻ: 362,
	Hôm: 363,
	hôm: 364,
	nhiều: 365,
	phiền: 366,
	lúc: 367,
	này: 368,
	rảnh: 369,
	cà: 370,
	phê: 371,
	nhé: 372,
	tại: 373,
	văn: 374,
	phòng: 375,
	ty: 376,
	trời: 377,
	khí: 378,
	mát: 379,
	mẻ: 380,
	đình: 381,
	mạnh: 382,
	hạnh: 383,
	phúc: 384,
	biệt: 385,
	hẹn: 386,
	mai: 387,
	số: 388,
	dự: 389,
	án: 390,
	qua: 391,
	email: 392,
	hoặc: 393,
	Chúng: 394,
	sắp: 395,
	xếp: 396,
	lịch: 397,
	họp: 398,
	chiều: 399,
	sẵn: 400,
	thấy: 401,
	ổn: 402,
	định: 403,
	kiến: 404,
	đóng: 405,
	góp: 406,
	giây: 407,
	lát: 408,
	ngay: 409,
	cơm: 410,
	trưa: 411,
	chưa: 412,
	đăng: 413,
	ký: 414,
	tham: 415,
	khóa: 416,
	tiếng: 417,
	Việt: 418,
	việt: 419,
	nâng: 420,
	viên: 421,
	tập: 422,
	đạt: 423,
	xuất: 424,
	sắc: 425,
	cô: 426,
	giáo: 427,
	tận: 428,
	tình: 429,
	giảng: 430,
	dạy: 431,
	Thành: 432,
	kiên: 433,
	trì: 434,
	đam: 435,
	mê: 436,
	ngần: 437,
	ngại: 438,
	chia: 439,
	sẻ: 440,
	khó: 441,
	khăn: 442,
	chóng: 443,
	toàn: 444,
	gọi: 445,
	thoại: 446,
	chất: 447,
	lượng: 448,
	hình: 449,
	trí: 450,
	tuệ: 451,
	nhân: 452,
	sửa: 453,
	chính: 454,
	tả: 455,
	tự: 456,
	gợi: 457,
	theo: 458,
	gõ: 459,
	phím: 460,
	hơn: 461,
	đặt: 462,
	phiên: 463,
	bản: 464,
	nhất: 465,
	trải: 466,
	nghiệm: 467,
	hữu: 468,
	ích: 469,
	chủ: 470,
	xử: 471,
	lý: 472,
	dữ: 473,
	thời: 474,
	gian: 475,
	nhóm: 476,
	nối: 477,
	mạng: 478,
	trước: 479,
	khi: 480,
	thử: 481,
	báo: 482,
	trực: 483,
	diện: 484,
	kế: 485,
	đơn: 486,
	giản: 487,
	dễ: 488,
	sử: 489,
	mật: 490,
	khoản: 491,
	tiên: 492,
	hàng: 493,
	đầu: 494,
	ngũ: 495,
	kỹ: 496,
	sư: 497,
	phần: 498,
	mềm: 499,
	tối: 500,
	hóa: 501,
	lắng: 502,
	nghe: 503,
	cải: 504,
	thiện: 505,
	sản: 506,
	phẩm: 507,
	mài: 508,
	sắt: 509,
	nên: 510
};

// Supported Personal Pronouns & Reciprocal Extraction Logic
MezonGrammarClient.SUPPORTED_PRONOUNS = ['anh', 'chị', 'em', 'sếp', 'cậu', 'ông', 'bà', 'bác', 'chú', 'cô', 'thầy', 'bạn', 'cả nhà', 'cháu'];

MezonGrammarClient.PRONOUN_ALIASES = {
	anh: 'anh',
	a: 'anh',
	'anh trai': 'anh',
	chị: 'chị',
	chi: 'chị',
	c: 'chị',
	'chị gái': 'chị',
	em: 'em',
	e: 'em',
	'em út': 'em',
	cháu: 'cháu',
	chau: 'cháu',
	'cháu gái': 'cháu',
	'cháu trai': 'cháu',
	sếp: 'sếp',
	sep: 'sếp',
	boss: 'sếp',
	leader: 'sếp',
	cậu: 'cậu',
	cau: 'cậu',
	tớ: 'cậu',
	to: 'cậu',
	ông: 'ông',
	ong: 'ông',
	bà: 'bà',
	ba: 'bà',
	bác: 'bác',
	bac: 'bác',
	chú: 'chú',
	chu: 'chú',
	cô: 'cô',
	co: 'cô',
	thầy: 'thầy',
	thay: 'thầy',
	bạn: 'bạn',
	ban: 'bạn',
	mình: 'bạn',
	minh: 'bạn',
	'cả nhà': 'cả nhà',
	'ca nha': 'cả nhà',
	'ca-nha': 'cả nhà',
	'mọi người': 'cả nhà',
	'moi nguoi': 'cả nhà',
	mng: 'cả nhà',
	mn: 'cả nhà',
	team: 'cả nhà',
	'anh em': 'anh'
};

MezonGrammarClient.normalizePronoun = function (pronoun) {
	if (!pronoun) return null;
	const p = pronoun
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[_-]/g, ' ');
	if (p === 'auto' || p === 'tu dong' || p === 'none') return null;
	return MezonGrammarClient.PRONOUN_ALIASES[p] || MezonGrammarClient.PRONOUN_ALIASES[pronoun.trim().toLowerCase()] || null;
};

MezonGrammarClient.extractTargetPronoun = function (text) {
	if (!text || !text.trim()) return 'bạn';
	const clean = text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');

	// 1. Group / Collective mentions
	if (/\b(ca nha oi|moi nguoi oi|team oi|mng oi|mn oi|ca nha|moi nguoi|team minh)\b/.test(clean)) {
		return 'cả nhà';
	}

	// 2. Asymmetric / Directional Two-Party Conversations
	if (/\b(em oi|e oi)\b/.test(clean) && /\b(giup anh|cho anh|anh gui|anh nho|anh bao|anh dan|nho anh)\b/.test(clean)) {
		return 'anh';
	}
	if (/\b(em oi|e oi)\b/.test(clean) && /\b(giup chi|cho chi|chi gui|chi nho|chi bao|chi dan)\b/.test(clean)) {
		return 'chị';
	}
	if (/\b(anh oi|a oi)\b/.test(clean) && /\b(giup em|cho em|em gui|em nho|em bao|em hoi)\b/.test(clean)) {
		return 'em';
	}
	if (/\b(chi oi|c oi)\b/.test(clean) && /\b(giup em|cho em|em gui|em nho|em bao|em hoi)\b/.test(clean)) {
		return 'em';
	}
	if (/\b(sep oi|boss oi)\b/.test(clean) && /\b(em gui|giup em|cho em|em nho)\b/.test(clean)) {
		return 'em';
	}
	if (/\b(giup sep|cho sep|sep gui|sep bao|sep dan)\b/.test(clean)) {
		return 'sếp';
	}

	// Directional inquiries / health questions to elders (chú, bác, cô)
	// e.g. "Hôm nay chú khoẻ không?", "Chú dạo này thế nào?", "Bác ăn cơm chưa?"
	if (
		/\b(chu|bac|co)\b/.test(clean) &&
		(/\b(khoe|dao nay|an com|khoe khong|khoe ko|khoe k|the nao|sao roi|on khong|ok khong)\b/.test(clean) ||
			(clean.includes('?') && !/\b(giup|check|gui|nho|bao)\b/.test(clean)))
	) {
		if (/\b(em|e)\b/.test(clean) && !/\b(chau)\b/.test(clean)) {
			return 'em';
		}
		return 'cháu';
	}

	// Inquiries directed to senior colleagues or teachers (anh, chị, sếp, thầy)
	if (/\b(anh|chi|sep|thay)\b/.test(clean) && /\b(khoe|dao nay|an com|khoe khong|khoe ko|khoe k|the nao|sao roi|on khong|ok khong)\b/.test(clean)) {
		return 'em';
	}

	// 3. Specific Relational Roles
	if (/\b(cau oi|to gui cau|giup to|cho to|to nho|cau check|cau giup|cau nhe|nhe cau|cau a)\b/.test(clean)) {
		return 'cậu';
	}
	if (/\b(cau|to)\b/.test(clean) && !/\b(anh|chi|sep|bac|chu|co|thay)\b/.test(clean)) {
		return 'cậu';
	}
	if (/\b(ong oi|toi gui ong|giup toi|cho toi|ong check|ong giup|ong nhe|nhe ong)\b/.test(clean)) {
		return 'ông';
	}
	if (/\b(ba oi|toi gui ba|ba check|ba giup|ba nhe|nhe ba)\b/.test(clean)) {
		return 'bà';
	}
	if (/\b(bac oi|bac|bac check|bac giup|bac nhe|gui bac|bac a)\b/.test(clean)) {
		return 'bác';
	}
	if (/\b(chu oi|chu check|chu giup|chu nhe|gui chu|chu a)\b/.test(clean)) {
		return 'chú';
	}
	if (/\b(co oi|co check|co giup|co nhe|gui co|co a)\b/.test(clean)) {
		return 'cô';
	}
	if (/\b(thay oi|thay check|thay giup|thay xem|thay a|kinh thay)\b/.test(clean)) {
		return 'thầy';
	}
	if (/\b(sep|boss|leader)\b/.test(clean)) {
		return 'sếp';
	}
	if (/\b(anh em)\b/.test(clean)) {
		return 'anh';
	}

	// 4. Single Vocatives / Explicit Mentions
	if (/\b(anh oi|a oi)\b/.test(clean)) return 'em';
	if (/\b(chi oi|c oi)\b/.test(clean)) return 'em';
	if (/\b(em oi|e oi)\b/.test(clean)) return 'anh';
	if (/\b(anh|a)\b/.test(clean)) return 'anh';
	if (/\b(chi|c)\b/.test(clean)) return 'chị';
	if (/\b(em|e)\b/.test(clean)) return 'em';

	return 'bạn';
};

MezonGrammarClient.extractPronounCandidates = function (text) {
	if (!text || !text.trim()) return ['bạn'];
	const clean = text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
	if (/\b(bac)\b/.test(clean)) {
		return ['cháu', 'bạn'];
	}
	if (/\b(co)\b/.test(clean)) {
		return ['cháu', 'em'];
	}
	if (/\b(cac chu|chu em)\b/.test(clean) && /\b(anh|chi|sep)\b/.test(clean)) {
		return ['anh'];
	}
	if (
		/\b(nghi lam|nghi hoc|nghi phep|nghi viec|nghi trua|nghi ngoi|nghi le|nghi tet|nghi he|nghi om|xin nghi|tam nghi|ngay nghi|vang mat|di muon|den muon|ban viec|co viec ban|nghi nhe|nghi nha|ve som|tu daily|daily nhe|tu hop|tu sync|ban xiu|ban ti|ban chut|ban dot xuat)\b/.test(
			clean
		)
	) {
		if (/\b(anh|a)\b/.test(clean)) {
			return ['anh'];
		}
		if (/\b(chi|c)\b/.test(clean)) {
			return ['chị'];
		}
		if (/\b(sep|boss)\b/.test(clean)) {
			return ['sếp'];
		}
		if (/\b(em|e)\b/.test(clean)) {
			return ['em'];
		}
	}
	if (/\bchu(?!\s+(y|trong|tam|thich|giai|nhat|tri))\b/.test(clean)) {
		return ['cháu', 'anh'];
	}
	if (/\b(anh oi|a oi|anh)\b/.test(clean)) {
		return ['em', 'chú'];
	}
	const primary = MezonGrammarClient.extractTargetPronoun(text);
	return [primary];
};

MezonGrammarClient.DEFAULT_LEAVE_REPLIES = {
	anh: ['Dạ vâng anh.', 'Dạ anh cứ nghỉ ngơi nhé ạ.', 'OK anh nhé.', 'Dạ em rõ rồi anh.', 'Dạ anh nghỉ ngơi cho khỏe nhé ạ.'],
	chị: ['Dạ vâng chị.', 'Dạ chị cứ nghỉ ngơi nhé ạ.', 'OK chị nhé.', 'Dạ em rõ rồi chị.', 'Dạ chị nghỉ ngơi cho khỏe nhé ạ.'],
	em: ['OK em nhé.', 'Em cứ nghỉ ngơi nhé.', 'Được rồi em nhé.', 'Anh rõ rồi em.', 'Nghỉ ngơi cho khỏe nhé em.'],
	sếp: ['Dạ vâng sếp ạ.', 'Dạ chúc sếp nghỉ ngơi thoải mái ạ.', 'Dạ em rõ rồi sếp.', 'Dạ công việc ở nhà để tụi em lo ạ.'],
	cậu: ['OK cậu nhé.', 'Cậu cứ nghỉ ngơi đi nhé.', 'Được rồi cậu nhé.', 'Nghỉ ngơi cho khỏe nhé cậu!'],
	ông: ['OK ông nhé.', 'Ông cứ nghỉ ngơi đi nhé.', 'Được rồi ông nhé.'],
	bà: ['OK bà nhé.', 'Bà cứ nghỉ ngơi đi nhé.', 'Được rồi bà nhé.'],
	bác: ['Dạ vâng bác.', 'Dạ bác cứ nghỉ ngơi nhé ạ.', 'Dạ cháu rõ rồi bác.'],
	chú: ['Dạ vâng chú.', 'Dạ chú cứ nghỉ ngơi nhé ạ.', 'Dạ cháu rõ rồi chú.'],
	cô: ['Dạ vâng cô.', 'Dạ cô cứ nghỉ ngơi nhé ạ.', 'Dạ cháu rõ rồi cô.'],
	thầy: ['Dạ vâng thầy.', 'Dạ thầy cứ nghỉ ngơi nhé ạ.', 'Dạ em rõ rồi ạ thầy.'],
	'cả nhà': ['OK cả nhà.', 'Chúc mọi người nghỉ ngơi vui vẻ nhé!', 'Nhất trí cả nhà.'],
	bạn: ['OK bạn nhé.', 'Bạn cứ nghỉ ngơi nhé.', 'Được bạn nhé.', 'Nghỉ ngơi cho khỏe nhé!'],
	cháu: ['OK cháu nhé.', 'Cháu cứ nghỉ ngơi đi nhé.', 'Được rồi cháu nhé.', 'Nghỉ ngơi cho khỏe nhé cháu!']
};

MezonGrammarClient.DEFAULT_HEALTH_REPLIES = {
	cháu: ['Dạ chú khỏe, cảm ơn cháu.', 'Chú vẫn khỏe, cháu thế nào?', 'Cảm ơn cháu, chú khỏe.', 'Chú khỏe, cảm ơn cháu nhé.'],
	em: ['Cảm ơn em, anh khỏe.', 'Anh khỏe, cảm ơn em nhé.', 'Dạ cảm ơn em, anh khỏe.', 'Anh vẫn khỏe, em thế nào?'],
	anh: ['Cảm ơn anh, em khỏe.', 'Dạ em khỏe, cảm ơn anh nhé.', 'Em vẫn khỏe, anh thế nào?', 'Dạ em khỏe ạ.'],
	chị: ['Cảm ơn chị, em khỏe.', 'Dạ em khỏe, cảm ơn chị nhé.', 'Em vẫn khỏe, chị thế nào?', 'Dạ em khỏe ạ.'],
	sếp: ['Dạ em cảm ơn sếp, em vẫn khỏe ạ.', 'Dạ em khỏe, cảm ơn sếp ạ.', 'Dạ em ổn, cảm ơn sếp quan tâm ạ.'],
	thầy: ['Dạ em cảm ơn thầy, em vẫn khỏe ạ.', 'Dạ em khỏe, cảm ơn thầy ạ.', 'Dạ em vẫn khỏe, thầy dạo này thế nào ạ?'],
	cậu: ['Cảm ơn cậu, tớ khỏe.', 'Tớ khỏe, cảm ơn cậu nhé.', 'Tớ vẫn khỏe, cậu thế nào?', 'Tớ ổn, cảm ơn cậu nha.'],
	bạn: ['Cảm ơn bạn, mình khỏe.', 'Mình khỏe, cảm ơn bạn nhé.', 'Mình vẫn khỏe, bạn thế nào?', 'Mình ổn, cảm ơn bạn nhé.'],
	'cả nhà': ['Cảm ơn cả nhà, em khỏe ạ.', 'Dạ em vẫn khỏe, cảm ơn cả nhà.', 'Em ổn, cảm ơn mọi người nhé.'],
	bác: ['Dạ cảm ơn bác, cháu khỏe ạ.', 'Dạ cháu khỏe, cảm ơn bác ạ.', 'Dạ cháu vẫn khỏe, bác dạo này thế nào ạ?'],
	chú: ['Dạ cảm ơn chú, cháu khỏe ạ.', 'Dạ cháu khỏe, cảm ơn chú ạ.', 'Dạ cháu vẫn khỏe, chú dạo này thế nào ạ?'],
	cô: ['Dạ cảm ơn cô, cháu khỏe ạ.', 'Dạ cháu khỏe, cảm ơn cô ạ.', 'Dạ cháu vẫn khỏe, cô dạo này thế nào ạ?'],
	ông: ['Cảm ơn ông, tôi khỏe.', 'Tôi khỏe, cảm ông nhé.', 'Dạ cháu khỏe, cảm ơn ông ạ.'],
	bà: ['Cảm ơn bà, tôi khỏe.', 'Tôi khỏe, cảm ơn bà nhé.', 'Dạ cháu khỏe, cảm ơn bà ạ.']
};

MezonGrammarClient.DEFAULT_MEAL_REPLIES = {
	cháu: ['Chú ăn rồi, cảm ơn cháu nhé.', 'Dạ chưa, lát chú đi ăn.', 'Được chứ cháu, đi thôi.', 'Cảm ơn cháu nhé.'],
	em: ['Anh ăn rồi, cảm ơn em.', 'Chưa em, lát anh đi ăn.', 'Đi chứ em!', 'Đi ăn thôi em ơi!'],
	anh: ['Em ăn rồi, cảm ơn anh.', 'Dạ chưa anh, lát em đi ăn.', 'Đi chứ anh!', 'Đi thôi anh ơi!'],
	chị: ['Em ăn rồi, cảm ơn chị.', 'Dạ chưa chị, lát em đi ăn.', 'Đi chứ chị!', 'Đi thôi chị ơi!'],
	sếp: ['Dạ em ăn rồi, cảm ơn sếp ạ.', 'Dạ em chưa sếp ơi, lát em đi ăn ạ.', 'Dạ vâng sếp, em đi liền ạ.'],
	thầy: ['Dạ em ăn rồi, cảm ơn thầy ạ.', 'Dạ em chưa, cảm ơn thầy đã hỏi thăm ạ.'],
	cậu: ['Tớ ăn rồi, cậu ăn chưa?', 'Chưa, đi ăn cùng tớ không?', 'Đi chứ, đi thôi!', 'Cà phê thôi cậu ơi!'],
	bạn: ['Mình ăn rồi, cảm ơn bạn.', 'Chưa bạn ơi, đi ăn cùng không?', 'Đi chứ bạn!', 'Cà phê thôi bạn ơi!'],
	'cả nhà': ['Em ăn rồi, cả nhà ăn chưa ạ?', 'Chưa cả nhà ơi, đi ăn thôi!', 'Đi thôi cả nhà ơi!'],
	bác: ['Dạ cháu ăn rồi, cảm ơn bác ạ.', 'Dạ cháu chưa, lát cháu ăn ạ.'],
	chú: ['Dạ cháu ăn rồi, cảm ơn chú ạ.', 'Dạ cháu chưa, lát cháu ăn ạ.'],
	cô: ['Dạ cháu ăn rồi, cảm ơn cô ạ.', 'Dạ cháu chưa, lát cháu ăn ạ.'],
	ông: ['Dạ cháu ăn rồi, ông ăn chưa ạ?', 'Dạ tôi ăn rồi, cảm ơn ông.'],
	bà: ['Dạ cháu ăn rồi, bà ăn chưa ạ?', 'Dạ tôi ăn rồi, cảm ơn bà.']
};

MezonGrammarClient.PRONOUN_TEMPLATES = {
	anh: {
		task_or_update: ['OK, anh.', 'Dạ vâng anh.', 'Dạ để em xử lý ngay ạ.', 'Nhất trí anh.', 'Tuyệt vời anh ơi!', 'Dạ để em kiểm tra ngay.'],
		question: ['Dạ được anh.', 'Dạ để em kiểm tra lại rồi báo anh nhé.', 'Dạ chưa anh ơi.', 'Dạ có anh nhé.'],
		thanks: ['Dạ không có gì anh!', 'Dạ không có chi anh.', 'Em rất vui được hỗ trợ anh!'],
		apology: ['Dạ không sao đâu anh!', 'Dạ anh đừng bận tâm ạ.', 'Không vấn đề gì đâu anh ạ.'],
		greeting: ['Dạ em chào anh!', 'Dạ em nghe đây anh.', 'Chào anh ạ!'],
		praise: ['Cảm ơn anh nhiều ạ!', 'Tuyệt vời anh ơi!', 'Dạ em cảm ơn anh!'],
		yes_no_question: [
			'Có chứ anh.',
			'Dạ có anh.',
			'Dạ được anh.',
			'Dạ mai em bận rồi anh ơi.',
			'Dạ để em xem lại đã nhé anh.',
			'Dạ chưa anh ơi.'
		],
		general: ['OK, anh.', 'Dạ vâng anh.', 'Nhất trí anh.', 'Dạ em rõ rồi anh.']
	},
	chị: {
		task_or_update: ['OK, chị.', 'Dạ vâng chị.', 'Để em xử lý luôn chị nhé.', 'Nhất trí chị.', 'Dạ để em kiểm tra ngay.'],
		question: ['Dạ được chị.', 'Dạ để em kiểm tra lại rồi báo chị nhé.', 'Dạ chưa chị ơi.', 'Dạ có chị nhé.'],
		thanks: ['Dạ không có gì chị!', 'Dạ không có chi chị.', 'Em rất vui được hỗ trợ chị!'],
		apology: ['Dạ không sao đâu chị!', 'Dạ chị đừng bận tâm ạ.', 'Không vấn đề gì đâu chị ạ.'],
		greeting: ['Dạ em chào chị!', 'Dạ em nghe đây chị.', 'Chào chị ạ!'],
		praise: ['Cảm ơn chị nhiều ạ!', 'Tuyệt vời chị ơi!', 'Dạ em cảm ơn chị!'],
		yes_no_question: [
			'Có chứ chị.',
			'Dạ có chị.',
			'Dạ được chị.',
			'Dạ mai em bận rồi chị ơi.',
			'Dạ để em xem lại đã nhé chị.',
			'Dạ chưa chị ơi.'
		],
		general: ['OK, chị.', 'Dạ vâng chị.', 'Nhất trí chị.', 'Dạ em rõ rồi chị.']
	},
	em: {
		task_or_update: ['OK em.', 'Để anh xem nhé.', 'Nhất trí em.', 'Được rồi em nhé.', 'Làm tốt lắm em!'],
		question: ['Được em nhé.', 'Để anh kiểm tra lại rồi báo em nhé.', 'Chưa em ơi.', 'Có em nhé.'],
		thanks: ['Không có gì em nhé!', 'Giúp được em là tốt rồi!', 'Chuyện nhỏ mà em.'],
		apology: ['Không sao đâu em nhé!', 'Đừng bận tâm em ơi.', 'Không vấn đề gì đâu em.'],
		greeting: ['Chào em nhé!', 'Anh nghe đây em.', 'Alo em!'],
		praise: ['Tuyệt vời em ơi!', 'Làm tốt lắm em!', 'Cảm ơn em nhé!'],
		yes_no_question: ['Có chứ em.', 'Được em nhé.', 'Anh có nhé.', 'Mai anh bận rồi em ơi.', 'Để anh xem lại đã nhé.', 'Chưa em ơi.'],
		general: ['OK em.', 'Nhất trí em.', 'Được rồi em nhé.', 'Em cứ làm đi nhé.']
	},
	sếp: {
		task_or_update: ['Dạ vâng sếp.', 'Dạ em xử lý ngay ạ.', 'Dạ em rõ rồi sếp.', 'Dạ để em báo cáo sếp ngay khi xong ạ.'],
		question: ['Dạ được sếp.', 'Dạ để em kiểm tra lại rồi báo sếp ngay ạ.', 'Dạ chưa xong ạ, em đang hoàn thiện.', 'Dạ vâng sếp.'],
		thanks: ['Dạ không có gì sếp!', 'Dạ là nhiệm vụ của em ạ.', 'Dạ em rất vui được hỗ trợ sếp!'],
		apology: ['Dạ không sao đâu sếp ạ!', 'Dạ sếp đừng bận tâm ạ.', 'Dạ em xin lỗi sếp ạ.'],
		greeting: ['Dạ em chào sếp!', 'Dạ em nghe đây sếp ạ.'],
		praise: ['Dạ cảm ơn sếp nhiều ạ!', 'Dạ em cảm ơn sếp đã động viên ạ!'],
		yes_no_question: [
			'Dạ có sếp.',
			'Dạ được sếp ạ.',
			'Dạ vâng sếp.',
			'Dạ mai em bận việc gia đình mất rồi sếp ơi.',
			'Dạ để em báo cáo sếp sau ạ.',
			'Dạ chưa xong ạ sếp.'
		],
		general: ['Dạ vâng sếp.', 'Dạ em rõ rồi sếp.', 'Dạ vâng ạ.']
	},
	cậu: {
		task_or_update: ['OK cậu.', 'Nhất trí cậu.', 'Để tớ xem luôn nhé.', 'Được cậu nhé.', 'Tuyệt vời quá cậu ơi!'],
		question: ['Được cậu nhé.', 'Để tớ kiểm tra rồi báo cậu nhé.', 'Chưa cậu ơi.', 'Có cậu nhé.'],
		thanks: ['Không có gì đâu cậu!', 'Giúp được cậu là vui rồi!', 'Chuyện nhỏ mà cậu!'],
		apology: ['Không sao đâu cậu!', 'Đừng lo nhé cậu, không vấn đề gì.', 'Chuyện nhỏ mà cậu.'],
		greeting: ['Chào cậu nhé!', 'Tớ đây, có chuyện gì thế?', 'Alo cậu!'],
		praise: ['Cảm ơn cậu nhiều nhé!', 'Quá đỉnh luôn cậu ơi!', 'Tuyệt vời cậu ơi!'],
		yes_no_question: ['Có chứ cậu.', 'Được cậu nhé.', 'Tớ có nhé.', 'Mai tớ bận rồi cậu ơi.', 'Để tớ xem lại đã nhé.', 'Chưa cậu ơi.'],
		general: ['OK cậu.', 'Nhất trí cậu.', 'Được cậu nhé.', 'OK nhé cậu.']
	},
	ông: {
		task_or_update: ['OK ông.', 'Nhất trí ông.', 'Để tôi xem luôn nhé.', 'Được ông nhé.'],
		question: ['Được ông nhé.', 'Để tôi kiểm tra rồi báo ông nhé.', 'Chưa ông ơi.', 'Có ông nhé.'],
		thanks: ['Không có gì đâu ông!', 'Chuyện nhỏ mà ông!'],
		apology: ['Không sao đâu ông!', 'Đừng bận tâm ông ơi.'],
		greeting: ['Chào ông nhé!', 'Tôi đây, có gì thế ông?', 'Alo ông!'],
		praise: ['Cảm ơn ông nhiều nhé!', 'Quá đỉnh luôn ông ơi!'],
		yes_no_question: ['Có chứ ông.', 'Được ông nhé.', 'Tôi có nhé.', 'Tôi bận mất rồi ông ơi.', 'Để tôi xem lại đã nhé.', 'Chưa ông ơi.'],
		general: ['OK ông.', 'Nhất trí ông.', 'Được ông nhé.']
	},
	bà: {
		task_or_update: ['OK bà.', 'Nhất trí bà.', 'Để tôi xem luôn nhé.', 'Được bà nhé.'],
		question: ['Được bà nhé.', 'Để tôi kiểm tra rồi báo bà nhé.', 'Chưa bà ơi.', 'Có bà nhé.'],
		thanks: ['Không có gì đâu bà!', 'Chuyện nhỏ mà bà!'],
		apology: ['Không sao đâu bà!', 'Đừng bận tâm bà ơi.'],
		greeting: ['Chào bà nhé!', 'Tôi đây, có gì thế bà?', 'Alo bà!'],
		praise: ['Cảm ơn bà nhiều nhé!', 'Quá đỉnh luôn bà ơi!'],
		yes_no_question: ['Có chứ bà.', 'Được bà nhé.', 'Tôi có nhé.', 'Tôi bận mất rồi bà ơi.', 'Để tôi xem lại đã nhé.', 'Chưa bà ơi.'],
		general: ['OK bà.', 'Nhất trí bà.', 'Được bà nhé.']
	},
	bác: {
		task_or_update: ['Dạ vâng bác.', 'Dạ để cháu xem ngay ạ.', 'Nhất trí bác ạ.', 'Dạ được bác nhé.'],
		question: ['Dạ được bác.', 'Dạ để cháu kiểm tra lại rồi thưa bác ạ.', 'Dạ chưa bác ơi.', 'Dạ vâng bác.'],
		thanks: ['Dạ không có gì đâu bác!', 'Dạ là việc cháu nên làm ạ!'],
		apology: ['Dạ không sao đâu bác!', 'Dạ bác đừng bận tâm ạ.'],
		greeting: ['Dạ cháu chào bác ạ!', 'Dạ cháu nghe đây bác.'],
		praise: ['Dạ cháu cảm ơn bác nhiều ạ!'],
		yes_no_question: ['Dạ có bác.', 'Dạ được bác ạ.', 'Dạ cháu bận mất rồi bác ơi.', 'Dạ để cháu xem lại đã ạ.', 'Dạ chưa bác ơi.'],
		general: ['Dạ vâng bác.', 'Dạ được bác ạ.', 'Dạ cháu rõ rồi bác.']
	},
	chú: {
		task_or_update: ['Dạ vâng chú.', 'Dạ để cháu xem ngay ạ.', 'Dạ được chú nhé.'],
		question: ['Dạ được chú.', 'Dạ để cháu kiểm tra rồi báo chú ạ.', 'Dạ chưa chú ơi.'],
		thanks: ['Dạ không có gì đâu chú!', 'Dạ việc nhỏ thôi chú ạ!'],
		apology: ['Dạ không sao đâu chú!', 'Dạ chú đừng bận tâm ạ.'],
		greeting: ['Dạ cháu chào chú ạ!', 'Dạ cháu nghe đây chú.'],
		praise: ['Dạ cháu cảm ơn chú nhiều ạ!'],
		yes_no_question: ['Dạ có chú.', 'Dạ được chú ạ.', 'Dạ cháu bận mất rồi chú ơi.', 'Dạ để cháu xem lại đã ạ.', 'Dạ chưa chú ơi.'],
		general: ['Dạ vâng chú.', 'Dạ được chú ạ.']
	},
	cô: {
		task_or_update: ['Dạ vâng cô.', 'Dạ để cháu xem ngay ạ.', 'Dạ được cô nhé.'],
		question: ['Dạ được cô.', 'Dạ để cháu kiểm tra rồi báo cô ạ.', 'Dạ chưa cô ơi.'],
		thanks: ['Dạ không có gì đâu cô!', 'Dạ việc nhỏ thôi cô ạ!'],
		apology: ['Dạ không sao đâu cô!', 'Dạ cô đừng bận tâm ạ.'],
		greeting: ['Dạ cháu chào cô ạ!', 'Dạ cháu nghe đây cô.'],
		praise: ['Dạ cháu cảm ơn cô nhiều ạ!'],
		yes_no_question: ['Dạ có cô.', 'Dạ được cô ạ.', 'Dạ cháu bận mất rồi cô ơi.', 'Dạ để cháu xem lại đã ạ.', 'Dạ chưa cô ơi.'],
		general: ['Dạ vâng cô.', 'Dạ được cô ạ.']
	},
	thầy: {
		task_or_update: ['Dạ vâng thầy.', 'Dạ em làm ngay ạ thầy.', 'Dạ em rõ rồi ạ thầy.'],
		question: ['Dạ được thầy.', 'Dạ để em kiểm tra rồi thưa thầy ạ.', 'Dạ chưa thầy ơi.'],
		thanks: ['Dạ không có chi thầy ạ!', 'Dạ là vinh hạnh của em ạ!'],
		apology: ['Dạ không sao đâu thầy ạ!', 'Dạ thầy đừng bận tâm ạ.'],
		greeting: ['Dạ em kính chào thầy ạ!', 'Dạ em nghe đây thầy.'],
		praise: ['Dạ em cảm ơn thầy nhiều ạ!'],
		yes_no_question: ['Dạ có thầy ạ.', 'Dạ được thầy ạ.', 'Dạ em bận mất rồi thầy ơi.', 'Dạ để em xem lại đã ạ.', 'Dạ chưa thầy ơi.'],
		general: ['Dạ vâng thầy.', 'Dạ được thầy ạ.']
	},
	'cả nhà': {
		task_or_update: ['OK cả nhà.', 'Nhất trí cả nhà.', 'Tuyệt vời cả nhà ơi!', 'Để mình xử lý luôn nhé.'],
		question: ['Được cả nhà nhé.', 'Để mình kiểm tra rồi cập nhật cả nhà nhé.', 'Chưa xong cả nhà ơi.', 'Có cả nhà nhé.'],
		thanks: ['Không có gì cả nhà ơi!', 'Rất vui được đồng hành cùng cả nhà!', 'Chuyện nhỏ mà cả nhà!'],
		apology: ['Không sao đâu cả nhà!', 'Đừng lo nhé cả nhà, không vấn đề gì.', 'Không vấn đề gì cả nhà ơi!'],
		greeting: ['Chào cả nhà!', 'Chào mọi người nhé!', 'Hello cả nhà!'],
		praise: ['Cảm ơn cả nhà nhiều!', 'Team mình đỉnh quá!', 'Tuyệt vời cả nhà ơi!'],
		yes_no_question: ['Có chứ cả nhà.', 'Được cả nhà nhé.', 'Mình có nhé.', 'Mình bận mất rồi cả nhà ơi.', 'Chưa xong cả nhà ơi.'],
		general: ['OK cả nhà.', 'Nhất trí cả nhà.', 'Được cả nhà nhé.']
	},
	bạn: {
		task_or_update: ['OK bạn.', 'Nhất trí.', 'Để mình kiểm tra luôn.', 'Tuyệt vời quá!'],
		question: ['Được bạn nhé.', 'Để mình kiểm tra lại nhé.', 'Chưa bạn ơi.', 'Có bạn nhé.'],
		thanks: ['Không có gì đâu bạn!', 'Dạ không có chi.', 'Rất vui được hỗ trợ bạn!'],
		apology: ['Không sao đâu bạn!', 'Đừng lo nhé, không vấn đề gì.', 'Chuyện nhỏ mà bạn.'],
		greeting: ['Chào bạn!', 'Mình đây, có chuyện gì thế?', 'Alo bạn.'],
		praise: ['Cảm ơn bạn nhiều!', 'Tuyệt quá!', 'Haha cảm ơn nhé.'],
		yes_no_question: ['Có chứ bạn.', 'Được bạn nhé.', 'Mình có nhé.', 'Mình bận mất rồi bạn ơi.', 'Để mình xem lại đã nhé.', 'Chưa bạn ơi.'],
		general: ['OK bạn.', 'Dạ vâng.', 'Nhất trí.', 'Để mình kiểm tra luôn.', 'Được bạn nhé.']
	},
	cháu: {
		task_or_update: ['OK cháu.', 'Để chú xem nhé cháu.', 'Nhất trí cháu.', 'Được rồi cháu nhé.', 'Làm tốt lắm cháu!'],
		question: ['Được cháu nhé.', 'Để chú kiểm tra lại rồi báo cháu nhé.', 'Chưa cháu ơi.', 'Có cháu nhé.'],
		thanks: ['Không có gì đâu cháu!', 'Chuyện nhỏ mà cháu.', 'Cảm ơn cháu nhiều nhé!'],
		apology: ['Không sao đâu cháu nhé!', 'Đừng bận tâm cháu ơi.', 'Không vấn đề gì đâu cháu.'],
		greeting: ['Chào cháu nhé!', 'Chú nghe đây cháu.', 'Alo cháu!'],
		praise: ['Cháu giỏi lắm!', 'Tuyệt vời cháu ơi!', 'Cảm ơn cháu nhiều nhé!'],
		yes_no_question: [
			'Cảm ơn cháu, chú khỏe.',
			'Chú khỏe, cảm ơn cháu nhé.',
			'Có chứ cháu.',
			'Được cháu nhé.',
			'Chú bận mất rồi cháu ơi.',
			'Chưa cháu ơi.'
		],
		general: ['OK cháu.', 'Nhất trí cháu.', 'Được rồi cháu nhé.', 'Cháu cứ làm đi nhé.'],
		leave_or_absence: ['OK cháu nhé.', 'Cháu cứ nghỉ ngơi đi nhé.', 'Được rồi cháu nhé.', 'Nghỉ ngơi cho khỏe nhé cháu!']
	}
};

MezonGrammarClient.ACCENT_CHAR_TO_ID = {
	'<pad>': 0,
	'<unk>': 1,
	' ': 2,
	'!': 3,
	'"': 4,
	'#': 5,
	$: 6,
	'%': 7,
	'&': 8,
	"'": 9,
	'(': 10,
	')': 11,
	'*': 12,
	'+': 13,
	',': 14,
	'-': 15,
	'.': 16,
	'/': 17,
	0: 18,
	1: 19,
	2: 20,
	3: 21,
	4: 22,
	5: 23,
	6: 24,
	7: 25,
	8: 26,
	9: 27,
	':': 28,
	';': 29,
	'<': 30,
	'=': 31,
	'>': 32,
	'?': 33,
	'@': 34,
	A: 35,
	B: 36,
	C: 37,
	D: 38,
	E: 39,
	F: 40,
	G: 41,
	H: 42,
	I: 43,
	J: 44,
	K: 45,
	L: 46,
	M: 47,
	N: 48,
	O: 49,
	P: 50,
	Q: 51,
	R: 52,
	S: 53,
	T: 54,
	U: 55,
	V: 56,
	W: 57,
	X: 58,
	Y: 59,
	Z: 60,
	'[': 61,
	'\\': 62,
	']': 63,
	'^': 64,
	_: 65,
	'`': 66,
	a: 67,
	b: 68,
	c: 69,
	d: 70,
	e: 71,
	f: 72,
	g: 73,
	h: 74,
	i: 75,
	j: 76,
	k: 77,
	l: 78,
	m: 79,
	n: 80,
	o: 81,
	p: 82,
	q: 83,
	r: 84,
	s: 85,
	t: 86,
	u: 87,
	v: 88,
	w: 89,
	x: 90,
	y: 91,
	z: 92,
	'{': 93,
	'|': 94,
	'}': 95,
	'~': 96,
	à: 97,
	á: 98,
	ả: 99,
	ã: 100,
	ạ: 101,
	ă: 102,
	ằ: 103,
	ắ: 104,
	ẳ: 105,
	ẵ: 106,
	ặ: 107,
	â: 108,
	ầ: 109,
	ấ: 110,
	ẩ: 111,
	ẫ: 112,
	ậ: 113,
	è: 114,
	é: 115,
	ẻ: 116,
	ẽ: 117,
	ẹ: 118,
	ê: 119,
	ề: 120,
	ế: 121,
	ể: 122,
	ễ: 123,
	ệ: 124,
	ì: 125,
	í: 126,
	ỉ: 127,
	ĩ: 128,
	ị: 129,
	ò: 130,
	ó: 131,
	ỏ: 132,
	õ: 133,
	ọ: 134,
	ô: 135,
	ồ: 136,
	ố: 137,
	ổ: 138,
	ỗ: 139,
	ộ: 140,
	ơ: 141,
	ờ: 142,
	ớ: 143,
	ở: 144,
	ỡ: 145,
	ợ: 146,
	ù: 147,
	ú: 148,
	ủ: 149,
	ũ: 150,
	ụ: 151,
	ư: 152,
	ừ: 153,
	ứ: 154,
	ử: 155,
	ữ: 156,
	ự: 157,
	ỳ: 158,
	ý: 159,
	ỷ: 160,
	ỹ: 161,
	ỵ: 162,
	đ: 163,
	À: 164,
	Á: 165,
	Ả: 166,
	Ã: 167,
	Ạ: 168,
	Ă: 169,
	Ằ: 170,
	Ắ: 171,
	Ẳ: 172,
	Ẵ: 173,
	Ặ: 174,
	Â: 175,
	Ầ: 176,
	Ấ: 177,
	Ẩ: 178,
	Ẫ: 179,
	Ậ: 180,
	È: 181,
	É: 182,
	Ẻ: 183,
	Ẽ: 184,
	Ẹ: 185,
	Ê: 186,
	Ề: 187,
	Ế: 188,
	Ể: 189,
	Ễ: 190,
	Ệ: 191,
	Ì: 192,
	Í: 193,
	Ỉ: 194,
	Ĩ: 195,
	Ị: 196,
	Ò: 197,
	Ó: 198,
	Ỏ: 199,
	Õ: 200,
	Ọ: 201,
	Ô: 202,
	Ồ: 203,
	Ố: 204,
	Ổ: 205,
	Ỗ: 206,
	Ộ: 207,
	Ơ: 208,
	Ờ: 209,
	Ớ: 210,
	Ở: 211,
	Ỡ: 212,
	Ợ: 213,
	Ù: 214,
	Ú: 215,
	Ủ: 216,
	Ũ: 217,
	Ụ: 218,
	Ư: 219,
	Ừ: 220,
	Ứ: 221,
	Ử: 222,
	Ữ: 223,
	Ự: 224,
	Ỳ: 225,
	Ý: 226,
	Ỷ: 227,
	Ỹ: 228,
	Ỵ: 229,
	Đ: 230
};

MezonGrammarClient.ACCENT_VOWEL_VARIANTS = {
	a: ['a', 'à', 'á', 'ả', 'ã', 'ạ', 'ă', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'â', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ'],
	e: ['e', 'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ê', 'ề', 'ế', 'ể', 'ễ', 'ệ'],
	i: ['i', 'ì', 'í', 'ỉ', 'ĩ', 'ị'],
	o: ['o', 'ò', 'ó', 'ỏ', 'õ', 'ọ', 'ô', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ơ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ'],
	u: ['u', 'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ư', 'ừ', 'ứ', 'ử', 'ữ', 'ự'],
	y: ['y', 'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ'],
	d: ['d', 'đ'],
	b: ['b', 'n'],
	n: ['n', 'b'],
	A: ['A', 'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ă', 'Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ', 'Â', 'Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ'],
	E: ['E', 'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 'Ê', 'Ề', 'Ế', 'Ể', 'Ễ', 'Ệ'],
	I: ['I', 'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị'],
	O: ['O', 'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ', 'Ô', 'Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ', 'Ơ', 'Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ'],
	U: ['U', 'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ', 'Ư', 'Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự'],
	Y: ['Y', 'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ'],
	D: ['D', 'Đ'],
	B: ['B', 'N'],
	N: ['N', 'B']
};

//Export for Node, CommonJS, and Browser
// if (typeof module !== 'undefined' && module.exports) {
// 	module.exports = { MezonGrammarClient };
// } else if (typeof window !== 'undefined') {
// 	window.MezonGrammarClient = MezonGrammarClient;
// }

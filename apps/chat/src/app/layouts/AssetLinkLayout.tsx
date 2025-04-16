// Lưu ý: Đường dẫn dưới đây cần điều chỉnh theo cấu trúc dự án của bạn
const jsonPath = '../../assets/.well-known/assetlinks.json';
const AssetLinkLayout = () => <iframe title={jsonPath} src={jsonPath} style={{ width: '100%', height: '100vh', border: 'none' }} />;

export default AssetLinkLayout;

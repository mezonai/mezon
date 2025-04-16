const jsonPath = '../../assets/.well-known/apple-app-site-association.json';
const AppleAppSiteAssociationLayout = () => <iframe title={jsonPath} src={jsonPath} style={{ width: '100%', height: '100vh', border: 'none' }} />;

export default AppleAppSiteAssociationLayout;

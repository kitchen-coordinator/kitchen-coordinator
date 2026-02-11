const isByPassEmail = (email: string) => (process.env.BYPASS_EMAILS?.toString() || '').includes(email);

export default isByPassEmail;

const Random = {
    generateToken(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
      }
}

export default Random;
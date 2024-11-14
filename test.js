const query = 'Indian Stock Market';
const domains = 'm.economictimes.com';
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

(async () => {
    const response = await fetch(
        
      `https://newsapi.org/v2/everything?` +
      `q=${query}&` +
      `domains=business-standard.com&` +
      `language=en&` +
      `from=${new Date().toISOString()}&` +
      `sortBy=publishedAt&` +
      `pageSize=20`,
      {
        headers: {
          'X-Api-Key': '6cd4ecd591af479185489f2cec87ddae'
        }
      }
    );
    const data = await response.json();
    console.log(data);
  })();
  

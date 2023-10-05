const axios = require('axios');

async function generateImageDale2() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Replace with your actual API key

  const data = {
    prompt: 'Creamy Garlic Parmesan Chicken: 4 boneless, skinless chicken breasts 2 tablespoons olive oil 4 cloves garlic, minced 1 cup heavy cream 1 cup chicken broth1 cup grated Parmesan cheese  1 teaspoon Italian seasoning Salt and pepper to taste Fresh parsley, chopped (for garnish) Cooked pasta or rice (optional, for serving)',
    n: 1,
    size: '1024x1024'
  };

  try {
    const response = await axios.post('https://api.openai.com/v1/images/generations', data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    });

    console.log('Response:', response.data);
    
    // You can return the response data here if needed
    return response.data;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    throw error; // You can choose to handle the error differently if needed
  }
}

module.exports = generateImage;

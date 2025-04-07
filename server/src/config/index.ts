import path from 'path';

export const config = {
  server: {
    port: process.env.PORT || 5000,
  },
  
  data: {
    directory: path.join(__dirname, '..', '..', 'data'),
  },
  
  upload: {
    directory: path.join(__dirname, '..', '..', 'uploads'),
  },
}; 
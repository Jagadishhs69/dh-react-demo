import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';

// This component demonstrates real-time console.log detection
const TestConsole = () => {
  const handleClick = () => {
    // Try typing console.log below this comment - you should see red underlines immediately

    // Better approach: Use proper error handling and user feedback
    alert('Button clicked successfully!');
  };

  return (
    <Paper elevation={2} sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Real-time Console.log Detection Test
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Try typing &quot;console.log(&apos;test&apos;)&quot; in the handleClick
        function above. You should see red underlines appear immediately as you
        type.
      </Typography>
      <Box>
        <Button variant="contained" onClick={handleClick}>
          Test Button (No Console Violations)
        </Button>
      </Box>
    </Paper>
  );
};

export default TestConsole;

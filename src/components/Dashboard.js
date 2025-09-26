import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Rating,
  LinearProgress,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import TestConsole from './TestConsole';

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [rating, setRating] = useState(4);
  const [name, setName] = useState('');

  const handleDialogOpen = () => setOpen(true);
  const handleDialogClose = () => setOpen(false);

  const handleSnackbarOpen = () => setSnackbarOpen(true);
  const handleSnackbarClose = () => setSnackbarOpen(false);
  const sampleData = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 234 567 8900',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1 234 567 8901',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+1 234 567 8902',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Material-UI Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Welcome Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Welcome to MUI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This is a sample React application showcasing various
                Material-UI components including cards, buttons, forms, and
                more.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="React" color="primary" sx={{ mr: 1 }} />
                <Chip label="Material-UI" color="secondary" sx={{ mr: 1 }} />
                <Chip label="JavaScript" variant="outlined" />
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary" onClick={handleSnackbarOpen}>
                Learn More
              </Button>
              <Button size="small" color="secondary" onClick={handleDialogOpen}>
                Open Dialog
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Settings Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                }
                label="Dark Mode"
              />
              <Box sx={{ mt: 2 }}>
                <Typography component="legend">Rate this app:</Typography>
                <Rating
                  name="app-rating"
                  value={rating}
                  onChange={(event, newValue) => setRating(newValue)}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Loading Progress:
                </Typography>
                <LinearProgress variant="determinate" value={75} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Form Card */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Sample Form
              </Typography>
              <TextField
                fullWidth
                label="Enter your name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Message"
                variant="outlined"
                multiline
                rows={3}
              />
            </CardContent>
            <CardActions>
              <Button variant="contained" color="primary">
                Submit
              </Button>
              <Button variant="outlined">Reset</Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Contact List */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Contact List
            </Typography>
            <List>
              {sampleData.map((contact) => (
                <ListItem key={contact.id} divider>
                  <ListItemIcon>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={contact.name}
                    secondary={
                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                          }}
                        >
                          <EmailIcon sx={{ fontSize: 16, mr: 1 }} />
                          {contact.email}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                          {contact.phone}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Real-time Console Detection Test */}
        <Grid item xs={12}>
          <TestConsole />
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleDialogOpen}
      >
        <AddIcon />
      </Fab>

      {/* Dialog */}
      <Dialog open={open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Sample Dialog</DialogTitle>
        <DialogContent>
          <Typography>
            This is a sample dialog showcasing Material-UI&apos;s dialog
            component. You can add forms, lists, or any other content here.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Dialog Input"
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogClose} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          This is a success message using Material-UI&apos;s Alert component!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;

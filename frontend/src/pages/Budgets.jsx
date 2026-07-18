import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const navigate = useNavigate();

  const fetchBudgets = async () => {
    try {
      const response = await API.get('budgets/');
      setBudgets(response.data);
    } catch (error) {
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('budgets/', { category, amount, start_date: new Date().toISOString().split('T')[0] });
      setCategory('');
      setAmount('');
      fetchBudgets();
      alert('Budget limit configured successfully!');
    } catch (error) {
      alert('Failed to configure budget limit. Try again.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => navigate('/')} sx={{ mb: 3 }}>← Back to Dashboard</Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Set Category Budget Limits</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Category Name" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Food, Shopping" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Monthly Limit (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Save Budget</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={3}>
        <Typography variant="h6" sx={{ p: 2 }}>Configured Budgets</Typography>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Monthly Target Limit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {budgets.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.category}</TableCell>
                <TableCell align="right">₹{b.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Budgets;
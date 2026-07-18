import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, MenuItem, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const response = await API.get('transactions/');
      setTransactions(response.data);
    } catch (error) {
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('transactions/', { amount, category, type, description, date: new Date().toISOString().split('T')[0] });
      setAmount('');
      setCategory('');
      setDescription('');
      fetchTransactions(); // Refresh the list
      alert('Transaction added successfully!');
    } catch (error) {
      alert('Failed to add transaction. Check your inputs.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button variant="outlined" onClick={() => navigate('/')} sx={{ mb: 3 }}>← Back to Dashboard</Button>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add New Entry</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth required label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth required label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Food, Salary" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Save Transaction</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={3}>
        <Typography variant="h6" sx={{ p: 2 }}>Transaction History</Typography>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.date}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell style={{ color: t.type === 'income' ? 'green' : 'red', fontWeight: 'bold' }}>
                  {t.type.toUpperCase()}
                </TableCell>
                <TableCell align="right" style={{ color: t.type === 'income' ? 'green' : 'red' }}>
                  ₹{t.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Transactions;
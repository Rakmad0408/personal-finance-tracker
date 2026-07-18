import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Dashboard() {
  const [data, setData] = useState({ total_income: 0, total_expenses: 0, savings: 0, budget_utilization: [] });
  const navigate = useNavigate();

  // Fetch metrics and budget calculations from the backend
  const fetchDashboardData = async () => {
    try {
      const response = await API.get('reports/dashboard/');
      setData(response.data);
    } catch (error) {
      // If credentials expire or user isn't logged in, redirect to login page
      navigate('/login');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Build the CSV file directly inside the browser using transaction data
  const handleExportCSV = async () => {
    try {
      const response = await API.get('transactions/');
      const transactions = response.data;
      
      // Build CSV structural rows
      let csvContent = "data:text/csv;charset=utf-8,Date,Category,Type,Amount,Description\n";
      transactions.forEach(t => {
        csvContent += `${t.date},${t.category},${t.type},${t.amount},${t.description || ''}\n`;
      });
      
      // Trigger a virtual file download wrapper
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "financial_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Could not export transaction logs.");
    }
  };

  // Setup visual format arrays for graphs
  const summaryData = [
    { name: 'Income', Amount: data.total_income },
    { name: 'Expenses', Amount: data.total_expenses },
  ];

  const pieData = data.budget_utilization.map(item => ({
    name: item.category,
    value: item.spent
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Top Header Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">Financial Dashboard</Typography>
        <Box>
          <Button variant="contained" color="primary" onClick={() => navigate('/transactions')} sx={{ mr: 1 }}>
            Manage Transactions
          </Button>
          <Button variant="contained" color="secondary" onClick={() => navigate('/budgets')} sx={{ mr: 1 }}>
            Manage Budgets
          </Button>
          <Button variant="outlined" color="success" onClick={handleExportCSV} sx={{ mr: 2 }}>
            Export CSV
          </Button>
          <Button variant="outlined" color="error" onClick={handleLogout}>Log Out</Button>
        </Box>
      </Box>

      {/* Metric Summaries */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
            <Typography variant="h6" color="textSecondary">Total Income</Typography>
            <Typography variant="h4" color="green">₹{data.total_income}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#ffebee' }}>
            <Typography variant="h6" color="textSecondary">Total Expenses</Typography>
            <Typography variant="h4" color="error">₹{data.total_expenses}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <Typography variant="h6" color="textSecondary">Net Savings</Typography>
            <Typography variant="h4" color="primary">₹{data.savings}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Visual Graphs Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Income vs Expenses</Typography>
            <BarChart width={400} height={300} data={summaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Amount" fill="#8884d8" />
            </BarChart>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ width: '100%', mb: 2 }}>Expense Breakdown</Typography>
            <PieChart width={300} height={300}>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name }) => name} outerRadius={80} fill="#8884d8" dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </Paper>
        </Grid>
      </Grid>

      {/* Dynamic Budget Alert Tracking Table */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Live Budget Monitoring</Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Allocated Budget</TableCell>
                <TableCell align="right">Amount Spent</TableCell>
                <TableCell align="center">Status Alert</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.budget_utilization && data.budget_utilization.length > 0 ? (
                data.budget_utilization.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">{row.category}</TableCell>
                    <TableCell align="right">₹{row.budget}</TableCell>
                    <TableCell align="right">₹{row.spent}</TableCell>
                    <TableCell align="center">
                      <Alert severity={row.status === 'Over Budget' ? 'error' : 'success'} sx={{ py: 0, justifyContent: 'center' }}>
                        {row.status}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No budget limits configured yet. Click 'Manage Budgets' to set one up!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default Dashboard;
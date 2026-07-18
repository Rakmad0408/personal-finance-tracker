import io
import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
import pandas as pd

# PDF Generation Utilities
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from transactions.models import Transaction
from budgets.models import Budget

# 1. Existing Dashboard Endpoint
class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = datetime.date.today()
        
        income = Transaction.objects.filter(user=user, type='Income').aggregate(Sum('amount'))['amount__sum'] or 0
        expenses = Transaction.objects.filter(user=user, type='Expense').aggregate(Sum('amount'))['amount__sum'] or 0
        
        budgets = Budget.objects.filter(user=user, month=today.month, year=today.year)
        budget_status = []
        
        for b in budgets:
            spent = Transaction.objects.filter(
                user=user, type='Expense', category=b.category,
                date__month=today.month, date__year=today.year
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            status = "Over Budget" if spent > b.monthly_limit else "Safe"
            
            budget_status.append({
                "category": b.category,
                "budget": float(b.monthly_limit),
                "spent": float(spent),
                "status": status
            })

        return Response({
            "total_income": float(income),
            "total_expenses": float(expenses),
            "savings": float(income - expenses),
            "budget_utilization": budget_status
        })


# 2. PDF Report Download Endpoint
class ExportPDFReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(user=user).order_by('-date')

        # Set up response buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []

        styles = getSampleStyleSheet()
        elements.append(Paragraph("Personal Finance Tracker - Monthly Report", styles['Title']))
        elements.append(Spacer(1, 20))

        # Build Data Table
        data = [["Date", "Category", "Type", "Amount", "Description"]]
        for t in transactions:
            data.append([str(t.date), t.category, t.type, f"${t.amount}", t.description or ""])

        t_table = Table(data)
        t_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('BACKGROUND', (0,1), (-1,-1), colors.beige),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
        ]))
        
        elements.append(t_table)
        doc.build(elements)

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="finance_report.pdf"'
        return response


# 3. CSV / Excel Report Download Endpoint
class ExportCSVReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(user=user).values('date', 'category', 'type', 'amount', 'description')

        # Use Pandas to cleanly shift DB items into sheet rows
        df = pd.DataFrame(list(transactions))
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="finance_report.csv"'
        
        df.to_csv(path_or_buf=response, index=False)
        return response
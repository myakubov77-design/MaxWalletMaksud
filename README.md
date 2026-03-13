# BazaarBudget AI (MaxWallet)

BazaarBudget AI is a clean, intelligent, and highly efficient personal finance application optimized for household spending patterns. It features a specialized "Bazaar Mode" for quick bulk entry and AI-driven insights to help users optimize their finances.

## 🚀 Features

- **Intelligent Dashboard**: Modern fintech-style overview of income, expenses, net balance, and savings rates with real-time charts.
- **Bazaar Purchase Mode**: Specialized interface for rapid entry of multiple items from a single bazaar visit, with auto-classification for common items.
- **AI Insights & Recommendations**: Integrated with **Google Gemini** to analyze spending patterns and provide actionable advice.
- **Smart Forecasting**: Predictive models estimating next month's financial situation based on historical averages.
- **Automated Reports**: Weekly and monthly breakdowns with visual category analysis and AI-generated written summaries.
- **CSV Export**: Export your financial data for external use.
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS and Motion.

## 🛠️ Tech Stack

- **Frontend**: React 19, Recharts, Tailwind CSS, Lucide React, Motion.
- **Backend**: Node.js (Express), Better-SQLite3.
- **AI**: Google Gemini API (`gemini-3-flash-preview`).

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/myakubov77-design/MaxWallet.git
   cd MaxWallet
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 📝 License

This project is licensed under the Apache-2.0 License.

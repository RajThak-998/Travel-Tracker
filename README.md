# Family Travel Tracker

A web application for tracking and visualizing countries visited by family members using an interactive world map with personalized color coding.

## Features

- **Interactive World Map**: SVG-based world map with clickable countries
- **Multi-User Support**: Add and manage multiple family members
- **Color-Coded Visualization**: Each family member has a unique color for their visited countries
- **Persistent Data Storage**: PostgreSQL database for user and travel data
- **Real-Time Updates**: Dynamic country coloring based on current user selection
- **Country Search**: Add countries by name with fuzzy search capability

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Frontend**: EJS templating, HTML, CSS, JavaScript
- **Dependencies**: pg (PostgreSQL client), body-parser

## Database Schema

### Tables

1. **users**
   ```sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     name VARCHAR(50) UNIQUE NOT NULL,
     color VARCHAR(20)
   );
   ```

2. **visited_countries**
   ```sql
   CREATE TABLE visited_countries (
     id SERIAL PRIMARY KEY,
     country_code CHAR(2) NOT NULL,
     user_id INTEGER REFERENCES users(id)
   );
   ```

3. **countries**
   ```sql
   CREATE TABLE countries (
     country_code CHAR(2) PRIMARY KEY,
     country_name TEXT NOT NULL
   );
   ```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "FamilyTravelTracker"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   ```bash
   cp .env.example .env
   ```
   - Update the `.env` file with your database credentials:
   ```env
   DB_USER=your_postgres_username
   DB_HOST=localhost
   DB_NAME=world
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   - Ensure PostgreSQL is installed and running
   - Create a database named `world`
   - Execute the SQL scripts in `queries.sql` to create tables and sample data

5. **Run the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - Open browser and navigate to `http://localhost:3000`

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=world
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# Server Configuration
PORT=3000

# Environment
NODE_ENV=development
```

**Important**: Never commit the `.env` file to version control. Use `.env.example` as a template for deployment.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/`      | Main page with world map and user interface |
| POST   | `/add`   | Add a visited country for current user |
| POST   | `/user`  | Switch between users or navigate to new user form |
| POST   | `/new`   | Create a new family member |

## File Structure

```
├── index.js              # Main server file
├── package.json          # Dependencies and project info
├── queries.sql           # Database schema and sample data
├── .env                  # Environment variables (not in version control)
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file
├── public/
│   └── styles/
│       ├── main.css      # Main stylesheet
│       └── new.css       # New user form styles
├── views/
│   ├── index.ejs         # Main page template with world map
│   └── new.ejs           # New user creation form
└── README.md             # Project documentation
```

## Key Features Implementation

### User Management
- Dynamic user loading from database on application startup
- Session-based current user tracking
- Type-safe user ID handling (integer consistency)

### Country Visualization
- SVG world map with country paths identified by ISO country codes
- JavaScript-based dynamic coloring using user-specific colors
- Error handling for missing countries and empty user lists

### Data Persistence
- PostgreSQL for reliable data storage
- Foreign key relationships between users and visited countries
- Transaction handling for data integrity

## Troubleshooting

### Common Issues

1. **Countries not coloring**: Check browser console for JavaScript errors and verify country codes match SVG path IDs

2. **Database connection errors**: Verify PostgreSQL service is running and credentials are correct

3. **New users not appearing**: Ensure database queries are executing successfully and users array is being refreshed

### Development Notes

- The application uses ES6 modules (`import`/`export`)
- Database queries use parameterized statements to prevent SQL injection
- User switching maintains state across page refreshes
- Color assignment supports standard CSS color names and hex values

## Browser Compatibility

- Modern browsers supporting ES6+ features
- SVG support required for map visualization
- JavaScript enabled for interactive functionality

## Deployment

### For Production Deployment:

1. **Environment Variables**
   - Set up environment variables on your hosting platform
   - Use the values from `.env.example` as a template
   - Ensure `NODE_ENV=production`

2. **Database Setup**
   - Set up PostgreSQL database on your hosting platform
   - Run the SQL scripts from `queries.sql`
   - Update `DB_HOST`, `DB_USER`, `DB_PASSWORD` in your environment

3. **Platform-Specific Instructions**
   
   **Railway/Render:**
   - Connect your GitHub repository
   - Set environment variables in the platform dashboard
   - Add PostgreSQL database addon
   - Deploy from the main branch

4. **Security Considerations**
   - Never commit `.env` file to version control
   - Use strong passwords for production databases
   - Enable SSL for database connections in production
   - Set appropriate CORS policies if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with appropriate error handling
4. Test with multiple users and edge cases
5. Submit a pull request

## License

This project is for educational purposes and personal use.

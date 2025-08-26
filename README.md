# PDF417 Healthcare Form Parser

A Next.js application for parsing PDF417 barcodes from German healthcare forms (Blankoformularbedruckung) including Muster 10, 6, 12, and 16.

## Features

🏥 **Healthcare Form Support**
- **Muster 10**: Laboratory Request Forms
- **Muster 6**: Referral Forms
- **Muster 12**: Nursing Care Requests
- **Muster 16**: Rehabilitation Requests

📱 **Multiple Input Methods**
- **Image Upload**: Drag & drop or select image files
- **Camera Scan**: Mobile camera support with environment facing camera
- **Manual Input**: Direct text input for tab-separated barcode data

🎨 **Modern UI**
- Responsive design (mobile-first)
- Light/dark theme support
- Professional healthcare-focused interface
- Real-time validation and error handling

## Getting Started

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pdf417-to-form
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Scanning from Images

1. Click on the **"Scan Image"** tab
2. **Drag & drop** an image file or **click to select**
3. On mobile devices, use the **"Use Camera"** button to capture directly
4. The app will automatically detect and parse PDF417 barcodes

### Manual Input

1. Click on the **"Manual Input"** tab
2. Paste tab-separated barcode data into the textarea
3. Click **"Load Sample"** to see example data
4. Click **"Parse Barcode"** to process the data

## Supported File Formats

- PNG, JPG, JPEG, GIF, BMP, WebP
- Higher resolution images work better
- Ensure barcodes are clearly visible and well-lit

## Architecture

### Core Components

- **`PDF417HealthcareParser`**: Core parsing engine with form-specific schemas
- **`BarcodeScanner`**: Image processing and ZXing integration
- **`ImageDropzone`**: Drag & drop and camera functionality
- **`HealthcareForm`**: Structured display of parsed data

### Key Technologies

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **@zxing/browser** for barcode scanning
- **react-dropzone** for file handling
- **Lucide React** for icons

## Form Field Mapping

### Standard Fields (All Forms)
- `formularcode`: 2-digit form number
- `formularcodeergaenzung`: Form supplement code
- `versionsnummer`: Barcode version number

### Patient Information
- Name, birth date, gender, address
- Title, postal code, city, street

### Insurance Information
- Provider ID and name
- Insured person ID and type
- Coverage dates and special groups

### Provider Information
- Practice and physician IDs
- Referral information
- Issue dates

## Data Validation

The parser validates:
- ✅ Required form identification fields
- ✅ Date formats (YYYYMMDD)
- ✅ Insurance type values (1, 3, 5)
- ✅ Gender values (M, W, X, D)
- ✅ Field length constraints

## Browser Support

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Camera**: Requires HTTPS in production

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/
│   ├── ui/             # Reusable UI components
│   └── features/       # Feature-specific components
├── lib/                # Utility functions & parsers
└── types/              # TypeScript definitions
```

### Adding New Form Types

1. Define the form schema in `PDF417HealthcareParser`
2. Add field mappings in the appropriate `getMusterXSchema()` method
3. Update TypeScript types in `types/healthcare.ts`

### Build for Production

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- German healthcare form standards (Blankoformularbedruckung)
- ZXing library for barcode scanning
- Next.js and Vercel teams
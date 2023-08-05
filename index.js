
const express = require('express');
const app = express();
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');

// Set up middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Function to generate the barcode SVG
function generateBarcodeSVG(upc) {
  const canvas = createCanvas();
  JsBarcode(canvas, upc, {
    format: 'ean13', // Barcode type
    lineColor: '#000', // Barcode color
    width: 2, // Barcode width in pixels
    height: 100, // Barcode height in pixels
    displayValue: true, // Show the plain text version of the barcode
 //   fontOptions: 'bold', // Font options for the text
  });
  return canvas.toBuffer();
}

// POST endpoint to generate the PDF price tag labels
app.post('/generatePriceTags', (req, res) => {
  const { upperLeftX,upperLeftY,labelX,labelY,startRow, startCol, priceTags } = req.body;

  // Create a new PDF document
  const doc = new PDFDocument({layout: 'landscape',size: 'A4'} );

  // Set the response content type to PDF
  res.contentType('application/pdf');

  // Set the response header for the PDF attachment
  res.setHeader('Content-Disposition', 'attachment; filename=price_tags.pdf');

  // Pipe the PDF document to the response
  doc.pipe(res);

  // Set beginning xPosition,yPosition
  let yPosition = upperLeftY + (startRow - 1)*labelY
  let xPosition = upperLeftX + (startCol - 1)*labelX
  console.log('xPosition ='+xPosition+', yPosition ='+yPosition,', upperLeftY ='+upperLeftY+', labelY = '+labelY);
  // Loop through each price tag and generate the barcode SVG
  priceTags.forEach((priceTag, index) => {
    const { upc, description, price } = priceTag;
/*
    // Calculate position for the current price tag
    const row = startRow + Math.floor(index / 3);
    const col = startCol + (index % 3);

    // Generate the barcode SVG and add it to the PDF
*/
    const barcodeSVG = generateBarcodeSVG(upc);
/*
    const xPosition = 12 + col * 150
    const yPosition = 10 + row * 90;
*/
    doc.image(barcodeSVG, xPosition+10, yPosition, { height: 28, width: 112 });

    // Add content to the PDF
//    doc.fontSize(18).text(`UPC: ${upc}`, xPosition, yPosition + 150);
    doc.fontSize(10).text(`${description}`, xPosition, yPosition + 30);
    doc.fontSize(24).text(`$${price}`, xPosition+12, yPosition + 42);
    
    // Increment xPosition,yPosition
    if (xPosition > 842 - labelX) {
    	xPosition = upperLeftX;
    	yPosition += labelY;
    }
    else {
    	xPosition += labelX;
    }
  });

  // Finalize the PDF
  doc.end();
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});


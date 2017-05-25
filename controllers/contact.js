const nodemailer = require('nodemailer');
const ses = require('nodemailer-ses-transport');

const transporter = nodemailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: [process.env.MAILGUN_USER],
    pass: [process.env.MAILGUN_PASSWORD]
  }
});
/**
 * GET /contact
 * Contact form page.
 */
exports.contactPage = (req, res) => {
  res.render('contact', {
    title: 'Contact'
  });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
exports.postContact = (req, res) => {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('message', 'Message cannot be blank').notEmpty();

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/contact');
  }

  const mailOptions = {
    to: process.env.EMAIL_ADDRESS,
    from: `CAMPSITE FINDER <${process.env.EMAIL_ADDRESS}>`,
    subject: `Campsite Finder - ${req.body.name} ${req.body.email} `,
    text: req.body.message
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      req.flash('errors', { msg: err.message });
      return res.redirect('/contact');
    }
    req.flash('success', { msg: 'Email has been sent successfully!' });
    res.redirect('/contact');
  });
};

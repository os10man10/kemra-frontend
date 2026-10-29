import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa6";
import { getAdminStoreSettings } from "./Admin/adminStoreSettings";
import "./ContactPage.css";

const channelDefinitions = [
  {
    key: "instagram",
    name: "Instagram",
    detail: "Follow our story",
    icon: <FaInstagram aria-hidden="true" />,
  },
  {
    key: "facebook",
    name: "Facebook",
    detail: "Find Kemra on Facebook",
    icon: <FaFacebookF aria-hidden="true" />,
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    detail: "Chat with our team",
    icon: <FaWhatsapp aria-hidden="true" />,
  },
  {
    key: "tiktok",
    name: "TikTok",
    detail: "Behind the scenes",
    icon: <FaTiktok aria-hidden="true" />,
  },
];

function ContactPage() {
  const settings = getAdminStoreSettings();
  const contactChannels = channelDefinitions
    .map((channel) => ({ ...channel, href: settings.socials[channel.key] }))
    .filter((channel) => channel.href);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const subject = form.get("subject");
    const message = form.get("message");
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    const mailto = new URL(`mailto:${settings.supportEmail}`);
    mailto.searchParams.set("subject", subject || "Kemra website inquiry");
    mailto.searchParams.set("body", body);
    window.location.href = mailto.toString();
  };

  return (
    <section className="contact-page" id="contact" aria-labelledby="contact-title">
      <div className="contact-page__inner">
        <div className="contact-page__intro">
          <p className="contact-page__eyebrow">We’d love to hear from you</p>
          <h1 id="contact-title">Let’s talk.</h1>
          <p className="contact-page__description">
            Questions about a collection or an order? Reach out to Kemra through the channel that suits you.
          </p>

          <div className="contact-page__divider" />
          <h2 className="contact-page__channels-title">Connect with Kemra</h2>
          <div className="contact-channels">
            {contactChannels.map((channel) => (
              <a
                className="contact-channel"
                href={channel.href}
                key={channel.name}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${channel.name}: ${channel.detail}`}
              >
                <span className="contact-channel__icon">{channel.icon}</span>
                <span className="contact-channel__copy">
                  <strong>{channel.name}</strong>
                  <small>{channel.detail}</small>
                </span>
                <span className="contact-channel__arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <p className="contact-page__signature">A modern connection, rooted in an ancient story.</p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form__heading">
            <h2>Send us a message</h2>
            <p>Your email app will open with your message ready to send.</p>
          </div>

          <div className="contact-form__fields">
            <label className="contact-field">
              <span>Your name</span>
              <input name="name" type="text" autoComplete="name" placeholder="Enter your name" required />
            </label>
            <label className="contact-field">
              <span>Email address</span>
              <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <label className="contact-field contact-field--full">
              <span>Subject</span>
              <input name="subject" type="text" placeholder="What can we help you with?" required />
            </label>
            <label className="contact-field contact-field--full">
              <span>Your message</span>
              <textarea name="message" rows="5" placeholder="Tell us a little more..." required />
            </label>
          </div>

          <button className="contact-form__submit" type="submit">
            Send message <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
      <div className="contact-page__footer" aria-hidden="true">
        <span>KEMRA · CRAFTED WITH MEANING</span>
        <span>EST. WITH ANCIENT SOUL</span>
      </div>
    </section>
  );
}

export default ContactPage;

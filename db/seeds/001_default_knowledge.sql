-- Default knowledge base entries for VoiceFlow (delivery assistant demo)
-- Run via: npm run db:seed

insert into knowledge (question, question_norm, answer)
values
  ('Hi', 'hi', 'Hello! Ask me about our delivery app: service areas, delivery types, items available, and order tracking.'),
  ('Hello', 'hello', 'Hi there! You can ask about delivery types, available items, pricing notes, and order tracking.'),
  ('How are you?', 'how are you', 'I am doing great — ready to help you with deliveries, items, hours, tracking, and payments.'),
  ('What is your name?', 'what is your name', 'I am your delivery assistant.'),
  ('What information can you give?', 'what information can you give', 'I can help with: delivery types we provide, items available, delivery hours, order tracking, and payment methods.'),
  ('What kind of deliveries do you provide?', 'what kind of deliveries do you provide', 'We provide grocery, fresh produce, dairy, bakery, snacks, beverages, household essentials, and personal care deliveries.'),
  ('What items are available?', 'what items are available', 'Popular items include fruits and vegetables, milk and dairy, breads, snacks, beverages, cleaning supplies, and daily essentials.'),
  ('Do you deliver in 10 minutes?', 'do you deliver in 10 minutes', 'We offer quick delivery in select areas. Typical delivery windows range from 10 to 30 minutes depending on location and demand.'),
  ('What are your delivery hours?', 'what are your delivery hours', 'Delivery is available from early morning to late night. Exact hours depend on your city and local availability.'),
  ('Do you deliver medicine?', 'do you deliver medicine', 'We can deliver OTC wellness and personal care items. Prescription medicines depend on local regulations.'),
  ('How to track my order?', 'how to track my order', 'You can track your order in real-time from the app''s Orders section.'),
  ('What payment methods are accepted?', 'what payment methods are accepted', 'We accept UPI, cards, netbanking, and cash on delivery in select locations.')
on conflict (question_norm) do nothing;

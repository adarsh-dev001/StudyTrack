
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Priya S.',
    role: 'NEET Aspirant',
    avatar: 'https://placehold.co/100x100/F97316/FFFFFF.png?text=P',
    dataAiHint: 'student avatar',
    quote: "The AI syllabus planner was a game-changer! It gave me a clear roadmap when I felt completely overwhelmed with the vast NEET syllabus.",
    stars: 5,
  },
  {
    name: 'Rohan M.',
    role: 'UPSC Aspirant',
    avatar: 'https://placehold.co/100x100/7DD3FC/000000.png?text=R',
    dataAiHint: 'user avatar',
    quote: "StudyTrack's gamification, especially the leaderboards and XP system, kept me incredibly consistent. I didn't want to lose my rank and that pushed me daily!",
    stars: 5,
  },
  {
    name: 'Aisha K.',
    role: 'JEE Aspirant',
    avatar: 'https://placehold.co/100x100/4ADE80/FFFFFF.png?text=A',
    dataAiHint: 'student avatar',
    quote: "The Pomodoro timer and task management are seamlessly integrated. It's helped me structure my study sessions and actually stick to them. Highly recommend!",
    stars: 4,
  },
];

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

function TestimonialsSectionComponent() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium mb-2">
            Student Success Stories
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            Loved by Aspirants Like You
          </h2>
          <p className="mt-3 md:mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg/relaxed">
            Hear what fellow students are saying about their StudyTrack experience.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="h-full flex flex-col bg-card shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="p-6">
                  <div className="flex items-center gap-4">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="rounded-full border-2 border-primary/50"
                      data-ai-hint={testimonial.dataAiHint}
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-card-foreground">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6 flex-grow relative">
                  <Quote className="absolute top-0 left-0 h-10 w-10 text-primary/20 transform -translate-x-2 -translate-y-2" />
                  <p className="text-muted-foreground italic relative z-10">"{testimonial.quote}"</p>
                </CardContent>
                <div className="px-6 pb-6 mt-auto">
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < testimonial.stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default React.memo(TestimonialsSectionComponent);

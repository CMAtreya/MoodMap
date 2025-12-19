import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { MapPin, Clock, Compass, Heart, ArrowRight, Zap, Coffee, Camera } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
};

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 backdrop-blur-md border border-white/40 text-sm font-medium text-slate-600 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              AI-Powered Itineraries
            </motion.div>
            
            <motion.h1 variants={item} className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Discover your city by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Mood</span>.
            </motion.h1>
            
            <motion.p variants={item} className="text-xl text-slate-600 max-w-lg leading-relaxed">
              Experience a personalized journey curated just for how you feel right now. No planning, just living.
            </motion.p>
            
            <motion.div variants={item} className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-8 text-base h-14 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" onClick={() => nav('/mood')}>
                Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-14 bg-white/40 border-white/40 backdrop-blur-md hover:bg-white/60">
                How it works
              </Button>
            </motion.div>

            <motion.div variants={item} className="pt-8 flex items-center gap-8 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600"><MapPin size={16} /></div>
                <span>Smart Routing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600"><Zap size={16} /></div>
                <span>Real-time AI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-rose-100 text-rose-600"><Heart size={16} /></div>
                <span>Personalized</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Abstract Visual / UI Demo */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-[9/16] md:aspect-auto md:h-[500px] bg-white rounded-[2.5rem] shadow-2xl border-8 border-white overflow-hidden ring-1 ring-slate-900/5">
               {/* Mock UI Content */}
               <div className="absolute inset-0 bg-slate-50 flex flex-col">
                  <div className="h-1/2 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80)' }} />
                  <div className="flex-1 p-6 space-y-4">
                     <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Recommended</div>
                          <h3 className="text-2xl font-bold text-slate-900">Urban Oasis</h3>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">98% Match</div>
                     </div>
                     <p className="text-sm text-slate-500">A perfect blend of nature and city vibes for your energetic mood today.</p>
                     <div className="flex gap-2 pt-2">
                        <div className="h-16 flex-1 rounded-2xl bg-slate-200 animate-pulse" />
                        <div className="h-16 flex-1 rounded-2xl bg-slate-200 animate-pulse" />
                        <div className="h-16 flex-1 rounded-2xl bg-slate-200 animate-pulse" />
                     </div>
                     <Button className="w-full mt-4 rounded-xl">Let's Go</Button>
                  </div>
               </div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 -left-12 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="p-2 bg-orange-100 rounded-full text-orange-500"><Coffee size={20} /></div>
              <div>
                <div className="text-xs text-slate-500">Next Stop</div>
                <div className="font-bold text-slate-800">Blue Bottle Coffee</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-32 -right-8 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 z-20"
            >
              <div className="p-2 bg-pink-100 rounded-full text-pink-500"><Camera size={20} /></div>
              <div>
                <div className="text-xs text-slate-500">Photo Op</div>
                <div className="font-bold text-slate-800">Golden Gate View</div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
             <h2 className="text-3xl md:text-5xl font-bold text-slate-900">Designed for spontaneity.</h2>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto">We combine real-time data with advanced AI to craft the perfect itinerary for your specific moment.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             {[
               { icon: <Compass className="w-8 h-8 text-indigo-600" />, title: "Mood-Based Discovery", desc: "Select from moods like Energetic, Melancholic, or Romantic to filter the world around you." },
               { icon: <Clock className="w-8 h-8 text-rose-600" />, title: "Smart Scheduling", desc: "Tell us how much time you have, and we'll fill it perfectly without rushing you." },
               { icon: <MapPin className="w-8 h-8 text-emerald-600" />, title: "Live Guidance", desc: "Turn-by-turn directions and real-time crowd updates keep your journey smooth." }
             ].map((feature, i) => (
               <Card key={i} className="border-0 shadow-lg bg-white/80 hover:scale-105 transition-transform duration-300">
                 <CardContent className="p-8 space-y-4">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                     {feature.icon}
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                   <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                 </CardContent>
               </Card>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
// Assuming axios or fetch wrapper exists, but I'll use fetch directly for now or axios if installed.
// Checking package.json would be good but standard fetch is fine.

const API_BASE_URL = 'http://localhost:8080/api'; // Adjust based on app.js check

const FoodRecommendation = () => {
    const [lists, setLists] = useState({ breakfast: [], lunch: [], dinner: [] });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            // Get current location
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const response = await fetch(`${API_BASE_URL}/itinerary/food-recommendations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lat: latitude, lng: longitude })
                    });

                    if (!response.ok) throw new Error('Failed to fetch data');

                    const data = await response.json();
                    setLists(data);
                    setLoading(false);
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                }
            }, (err) => {
                setError('Unable to retrieve location');
                setLoading(false);
            });
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const moveItem = (category, index, direction) => {
        const newList = [...lists[category]];
        const [item] = newList.splice(index, 1);
        newList.splice(index + direction, 0, item);
        setLists(prev => ({ ...prev, [category]: newList }));
    };

    const removeItem = (category, index) => {
        const newList = [...lists[category]];
        newList.splice(index, 1);
        setLists(prev => ({ ...prev, [category]: newList }));
    };

    const selectItem = (item) => {
        setSelected(item);
        // You might want to navigate or save this selection
    };

    const renderList = (category, items) => (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 capitalize text-gray-800">{category}</h2>
            <div className="space-y-4">
                <AnimatePresence>
                    {items.map((place, index) => (
                        <motion.div
                            key={place.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                        >
                            <Card className={`relative overflow-hidden transition-all ${selected?.id === place.id ? 'ring-2 ring-primary border-primary' : ''}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold">{place.name}</h3>
                                        <div className="text-sm text-gray-500 mt-1 flex gap-2">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{place.categories?.[0]}</span>
                                            {place.rating && <span className="text-yellow-600 font-bold">★ {place.rating}</span>}
                                        </div>
                                        <div className="mt-2 text-sm text-gray-700">
                                            <span className="font-medium">Travel: </span>
                                            {place.travelTimeMinutes} mins (walking)
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 ml-4">
                                        <button
                                            onClick={() => selectItem(place)}
                                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${selected?.id === place.id ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90 bg-black text-white'}`}
                                        >
                                            {selected?.id === place.id ? 'Selected' : 'Opt For'}
                                        </button>

                                        <div className="flex gap-1 justify-end">
                                            {index > 0 && (
                                                <button onClick={() => moveItem(category, index, -1)} className="p-1 hover:bg-gray-100 rounded" title="Move Up">
                                                    ↑
                                                </button>
                                            )}
                                            {index < items.length - 1 && (
                                                <button onClick={() => moveItem(category, index, 1)} className="p-1 hover:bg-gray-100 rounded" title="Move Down">
                                                    ↓
                                                </button>
                                            )}
                                            <button onClick={() => removeItem(category, index)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove">
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {items.length === 0 && <p className="text-gray-400 italic">No items left in this category.</p>}
            </div>
        </div>
    );

    if (loading) return <div className="flex justify-center items-center h-screen">Loading delicious options...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 pb-24">
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Food & Drink
            </h1>
            <p className="text-gray-600 mb-8">Curated recommendations nearby (0km radius)</p>

            {renderList('breakfast', lists.breakfast)}
            {renderList('lunch', lists.lunch)}
            {renderList('dinner', lists.dinner)}

            {selected && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-full px-8 py-4 border border-gray-200 z-50 flex items-center gap-4"
                >
                    <div>
                        <div className="text-sm text-gray-500">You opted for</div>
                        <div className="font-bold text-lg">{selected.name}</div>
                    </div>
                    <Button className="rounded-full" onClick={() => alert(`Navigation started to ${selected.name}!`)}>
                        Go Now ➔
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

export default FoodRecommendation;

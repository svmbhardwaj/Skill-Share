import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/PostGig.module.css';

export default function PostGig() {
    const router = useRouter();
    
    // State for each form field
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState(''); // Added price, as it's required by the backend
    const [contactInfo, setContactInfo] = useState('');
    const [error, setError] = useState('');

    // Check if user is logged in before showing the page
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to post a gig.');
            router.push('/login'); // Assuming you have a login page
        }
    }, [router]);

    // Function to handle form submission
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const token = localStorage.getItem('token');
        if (!category) {
            setError('Please select a category.');
            return;
        }

        try {
            // API call to the backend
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the auth token
                },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    price: Number(price), // Convert price to a number
                    contactInfo,
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert('Gig posted successfully!');
                router.push('/browse'); // Redirect to the browse page
            } else {
                setError(data.error || 'Failed to post gig.');
            }
        } catch (err) {
            setError('Could not connect to the server.');
        }
    };

    return (
        <>
            <Head>
                <title>Post a Gig | SkillShare</title>
                <meta name="description" content="Offer your skills to your local community" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.heading}>
                    <span className={styles.white}>Post a </span>
                    <span className={styles.blue}>New Gig</span>
                </h1>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>
                        Title
                        <input
                            type="text"
                            placeholder="e.g. Home tutoring"
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </label>

                    <label className={styles.label}>
                        Description
                        <textarea
                            placeholder="Describe your skill or offering..."
                            className={styles.input}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </label>

                    <label className={styles.label}>
                        Category
                        <select 
                            className={styles.input}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select category</option>
                            <option value="Education">Education</option>
                            <option value="Repair">Repair</option>
                            <option value="Health & Fitness">Health & Fitness</option>
                            <option value="Tech Help">Tech Help</option>
                        </select>
                    </label>

                    <label className={styles.label}>
                        Price ($)
                        <input
                            type="number"
                            placeholder="e.g. 50"
                            className={styles.input}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </label>

                    <label className={styles.label}>
                        Contact Info
                        <input
                            type="text"
                            placeholder="Phone or email"
                            className={styles.input}
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            required
                        />
                    </label>

                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    
                    <button type="submit" className={styles.button}>
                        Submit Gig
                    </button>
                </form>
            </main>
        </>
    );
}
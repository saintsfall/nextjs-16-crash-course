'use client'

import {useState} from "react";
import { SubmitEventHandler} from "react";

export default function BookEvent() {
    const [email, setEmail] = useState('')
    const [submited, setSubmited] = useState(false)

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setTimeout(() => {
            setSubmited(true)
        }, 1000)

    }
    
    return (
        <div id="book-event">
            {submited ? (
                <p className="text-sm">Thank you for signing up</p>
            ): (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email" />
                    </div>

                    <button type="submit" className="button-submit">Submit</button>
                </form>
            )}
        </div>
    )
}
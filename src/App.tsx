import { useState, useEffect, useCallback } from "react";
import * as Sentry from "@sentry/react";
import "./App.css";
import wrenchImg from "../assets/wrench.png";
import nailsImg from "../assets/nails.png";
import hammerImg from "../assets/hammer.png";

const monify = (n: number) => (n / 100).toFixed(2);
const getUniqueId = () => "_" + Math.random().toString(36).substring(2, 9);

type StoreItem = {
  id: string;
  name: string;
  price: number;
  img: string;
};

const storeItems: StoreItem[] = [
  {
    id: "wrench",
    name: "Wrench",
    price: 500,
    img: wrenchImg,
  },
  {
    id: "nails",
    name: "Nails",
    price: 25,
    img: nailsImg,
  },
  {
    id: "hammer",
    name: "Hammer",
    price: 1000,
    img: hammerImg,
  },
];

const email = `${Math.random().toString(36).substring(2, 6)}@yahoo.com`;

const App = () => {
  const [cart, setCart] = useState<StoreItem[]>([]);
  const [hasError, setHasError] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const globalErrorHandler = () => {
      setHasError(true);
      setSuccess(false);
    };
    window.addEventListener("error", globalErrorHandler);

    // Add context to error/event on the global scope
    // View this data in "Tags"
    Sentry.setUser({ email: email }); // attach user/email context
    Sentry.setTag("customerType", "medium-plan"); // custom-tag

    return () => {
      // Clean up the side effect
      window.removeEventListener("error", globalErrorHandler);
    };
  }, []); // Only run this effect once, when the component mounts

  const buyItem = useCallback((item: StoreItem) => {
    setCart((prevCart) => {
      const newCart = [...prevCart, item];
      // Add context to error/event
      // View this data in "Additional Data"
      Sentry.getIsolationScope().setExtra("cart", JSON.stringify(newCart));
      // View this data in "Breadcrumbs"
      Sentry.addBreadcrumb({
        category: "cart",
        message: "User added " + item.name + " to cart",
        level: "info",
      });
      return newCart;
    });
    setSuccess(false);
  }, []);

  const resetCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setCart([]);
    setHasError(false);
    setSuccess(false);

    // Reset context for error/event
    Sentry.getIsolationScope().setExtra("cart", "");
    Sentry.getIsolationScope().addBreadcrumb({
      category: "cart",
      message: "User emptied cart",
      level: "info",
    });
  };

  //This function is intentionally broken to illustrate error handling.
  const myCodeIsMorePerfect = () => {
    throw new Error("This function is intentionally broken!");
  };

  const checkout = () => {
    // Generate an explicit error
    myCodeIsMorePerfect();

    // generate unique transactionId and set as Sentry tag
    const transactionId = getUniqueId();
    Sentry.setTag("transaction_id", transactionId);

    // // OR Set transctionID as header
    // const order = {
    //   email,
    //   cart,
    // };
    // const fetchData = {
    //   method: "POST",
    //   body: JSON.stringify(order),
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-Transaction-ID": transactionId,
    //   },
    // };

    /*
      POST request to /checkout endpoint.
        - Custom header with transactionId for transaction tracing
        - throw error if response !== 200
    */
    // fetch("http://localhost:8000/checkout", fetchData)
    //   .then(response => {
    //     if (!response.ok) {
    //       throw new Error(`${response.status} - ${response.statusText || 'Unknown error'}`);
    //     }
    //     return response.json();
    //   })
    //   .then(data => {
    //     // Handle successful response data here
    //     console.log("Checkout successful:", data);
    //     setSuccess(true);
    //   })
    //   .catch(error => {
    //     console.error("Checkout failed:", error);
    //     setHasError(true);
    //   });
  };

  const total = cart.reduce((t, i) => t + i.price, 0);
  const cartDisplay = cart.reduce(
    (c, { id }) => {
      c[id] = c[id] ? c[id] + 1 : 1;
      return c;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="App">
      <main>
        <header>
          <h1>Online Hardware Store</h1>
        </header>

        <div className="inventory">
          {storeItems.map((item) => {
            const { name, id, img, price } = item;
            return (
              <div className="item" key={id}>
                <div className="thumbnail">
                  <img src={img} alt="" />
                </div>
                <p>{name}</p>
                <div className="button-wrapper">
                  <strong>${monify(price)}</strong>
                  <button onClick={() => buyItem(item)}>Buy!</button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <div className="sidebar">
        <header>
          <h4>Hi, {email}!</h4>
        </header>
        <div className="cart">
          {cart.length ? (
            <div>
              {Object.keys(cartDisplay).map((id) => {
                const { name, price } = storeItems.find((i) => i.id === id)!;
                const qty = cartDisplay[id];
                return (
                  <div className="cart-item" key={id}>
                    <div className="cart-item-name">
                      {name} x{qty}
                    </div>
                    <div className="cart-item-price">
                      ${monify(price * qty)}
                    </div>
                  </div>
                );
              })}
              <hr />
              <div className="cart-item">
                <div className="cart-item-name">
                  <strong>Total</strong>
                </div>
                <div className="cart-item-price">
                  <strong>${monify(total)}</strong>
                </div>
              </div>
            </div>
          ) : (
            "Your cart is empty"
          )}
        </div>
        {hasError && <p className="cart-error">Something went wrong</p>}
        {success && (
          <p className="cart-success">Thank you for your purchase!</p>
        )}
        <button onClick={checkout} disabled={cart.length === 0}>
          Checkout
        </button>{" "}
        {cart.length > 0 && (
          <button onClick={resetCart} className="cart-reset">
            Empty cart
          </button>
        )}
      </div>
    </div>
  );
};

export default App;

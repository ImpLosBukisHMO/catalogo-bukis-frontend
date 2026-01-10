import { FaCartPlus } from "react-icons/fa";
import { TiHeartFullOutline } from "react-icons/ti";

/*
TO DO:
- Integrate with backend.
- Manage functionality when adding products on the order and/or favorites.
- Fetch colors.
- The products name should redirect to the product details page 
  (coming soon).
*/

const ProductCard = (props) => {
    return (
        <div className="mx-2 p-5 is-flex is-flex-direction-column is-align-items-center" style={{ borderRadius: 12, border: '1px solid #c3c3c3', boxShadow: '0 2px 5px rgba(0,0,0,0.35)', backgroundColor: '#f5f5f5' }}>
            <div>
                <img src={"https://placehold.net/600x600.png"}
                    style={{
                        width: 'auto',
                        height: 150,
                        borderRadius: 12,
                        border: '2px solid #c3c3c3',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.35)'
                    }} />
            </div>
            <div className="mt-3">
                <p className="is-size-5 has-text-weight-bold" style={{ color: 'black' }}>Producto</p>
                <p className="is-size-7 has-text-weight-light" style={{ color: 'black' }}>No. ítem: XXXX-XXXX</p>
                <p className="is-size-7 has-text-weight-light" style={{ color: 'black' }}>$ 00.00 MXN</p>
                {props.disponible ? <p className="is-size-7 has-text-weight-light" style={{ color: 'green' }}>Disponible</p> : <p className="is-size-7 has-text-weight-light" style={{ color: 'red' }}>No disponible</p>}
                
                <div className="is-flex align-items-center my-1">
                    <button className="mt-1 p-1 mr-3 custom-btn is-flex is-align-items-center is-justify-content-center">
                        <FaCartPlus size={20} />
                        <p className='is-size-7'>&nbsp;&nbsp;Añadir al pedido</p>
                    </button>
                    <button className="mt-1 p-1 favorite-product-btn">
                        <TiHeartFullOutline size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;